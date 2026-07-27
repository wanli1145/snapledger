import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const EMBED_DIM = 1024;

let pool;

function getSsl() {
  const caPath = path.join(process.env.HOME || "", ".postgresql", "root.crt");
  if (fs.existsSync(caPath)) {
    return { ca: fs.readFileSync(caPath, "utf8") };
  }
  return { rejectUnauthorized: true };
}

export function hasDatabase() {
  return Boolean(process.env.COCKROACH_DATABASE_URL);
}

export function getPool() {
  if (!process.env.COCKROACH_DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.COCKROACH_DATABASE_URL,
      ssl: getSsl(),
      max: 5,
    });
  }
  return pool;
}

function naturalKey(tx) {
  const items = (tx.items || [])
    .map((i) => `${i.name}|${Number(i.amount).toFixed(2)}|${i.category}`)
    .sort()
    .join(";");
  return crypto
    .createHash("sha256")
    .update(`${tx.date}|${tx.merchant}|${Number(tx.total).toFixed(2)}|${items}`)
    .digest("hex");
}

// 可复现的本地语义 embedding：hashing trick + L2 normalize。
// 这是没有 AWS Bedrock 前的零成本实现；接 Titan/Bedrock embeddings 时只替换这个函数，
// CockroachDB VECTOR 列与向量索引路径保持不变。
export function makeEmbedding(text) {
  const vector = new Float32Array(EMBED_DIM);
  const tokens = String(text || "")
    .toLowerCase()
    .match(/[\p{Script=Han}]{1,2}|[a-z0-9]+/gu) || [];
  for (const token of tokens) {
    const hash = crypto.createHash("sha256").update(token).digest();
    const idx = hash.readUInt32BE(0) % EMBED_DIM;
    const sign = hash[4] % 2 === 0 ? 1 : -1;
    vector[idx] += sign;
  }
  let norm = Math.sqrt(vector.reduce((a, v) => a + v * v, 0));
  if (!norm) norm = 1;
  return Array.from(vector, (v) => Number((v / norm).toFixed(6)));
}

function vectorLiteral(vec) {
  return `[${vec.join(",")}]`;
}

function itemMemoryText(item, tx = {}) {
  return `${tx.merchant || ""} ${item.name || ""} ${item.category || ""} ${Number(item.amount || 0).toFixed(2)}`;
}

export async function listTransactions() {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query(`
    SELECT
      r.id,
      r.merchant,
      r.tx_date::STRING AS date,
      r.total::FLOAT8 AS total,
      r.source,
      extract(epoch FROM r.created_at) * 1000 AS "createdAt",
      COALESCE(
        json_agg(
          json_build_object(
            'name', i.name,
            'amount', i.amount::FLOAT8,
            'quantity', i.quantity::FLOAT8,
            'category', i.category
          ) ORDER BY i.created_at, i.name
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::JSON
      ) AS items
    FROM receipts r
    LEFT JOIN receipt_items i ON i.receipt_id = r.id
    GROUP BY r.id
    ORDER BY r.tx_date DESC, r.created_at DESC
  `);
  return rows.map((r) => ({ ...r, id: String(r.id), createdAt: Number(r.createdAt) }));
}

export async function insertTransaction(tx) {
  const db = getPool();
  if (!db) return null;
  const client = await db.connect();
  const key = naturalKey(tx);
  try {
    await client.query("BEGIN");
    const receipt = await client.query(
      `INSERT INTO receipts (natural_key, merchant, tx_date, total, source, created_at)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))
       ON CONFLICT (natural_key) DO UPDATE SET natural_key = excluded.natural_key
       RETURNING id, tx_date::STRING AS date, created_at`,
      [
        key,
        tx.merchant || "未知商家",
        tx.date || new Date().toISOString().slice(0, 10),
        Number(tx.total) || 0,
        tx.source || "scan",
        Number(tx.createdAt) || Date.now(),
      ]
    );
    const id = receipt.rows[0].id;
    const existing = await client.query(`SELECT count(*)::INT AS count FROM receipt_items WHERE receipt_id = $1`, [id]);
    if (Number(existing.rows[0].count) === 0) {
      for (const item of tx.items || []) {
        const embedding = makeEmbedding(itemMemoryText(item, tx));
        await client.query(
          `INSERT INTO receipt_items (receipt_id, name, amount, quantity, category, embedding)
           VALUES ($1, $2, $3, $4, $5, $6::VECTOR)`,
          [
            id,
            item.name || "未命名商品",
            Number(item.amount) || 0,
            Number(item.quantity) || 1,
            item.category || "其他",
            vectorLiteral(embedding),
          ]
        );
      }
    }
    await client.query("COMMIT");
    return { ...tx, id: String(id) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function backfillEmbeddings() {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query(`
    SELECT i.id, i.name, i.category, i.amount::FLOAT8 AS amount, r.merchant
    FROM receipt_items i
    JOIN receipts r ON r.id = i.receipt_id
    WHERE i.embedding IS NULL
  `);
  for (const row of rows) {
    const embedding = makeEmbedding(itemMemoryText(row, row));
    await db.query(`UPDATE receipt_items SET embedding = $2::VECTOR WHERE id = $1`, [
      row.id,
      vectorLiteral(embedding),
    ]);
  }
  return rows.length;
}

export async function deleteTransaction(id) {
  const db = getPool();
  if (!db) return false;
  const { rowCount } = await db.query(`DELETE FROM receipts WHERE id = $1`, [id]);
  return rowCount > 0;
}

export async function syncTransactions(transactions) {
  const db = getPool();
  if (!db) return null;
  let inserted = 0;
  for (const tx of transactions || []) {
    const before = await listTransactions();
    const beforeCount = before.length;
    await insertTransaction({ ...tx, source: tx.source || "scan" });
    const after = await listTransactions();
    if (after.length > beforeCount) inserted += 1;
  }
  return { inserted, total: (await listTransactions()).length };
}

async function vectorSearch(question, limit = 8) {
  const db = getPool();
  const queryEmbedding = vectorLiteral(makeEmbedding(question));
  const { rows } = await db.query(
    `SELECT
       r.merchant,
       r.tx_date::STRING AS date,
       i.name,
       i.category,
       i.amount::FLOAT8 AS amount,
       (i.embedding <=> $1::VECTOR) AS distance
     FROM receipt_items i
     JOIN receipts r ON r.id = i.receipt_id
     WHERE i.embedding IS NOT NULL
     ORDER BY i.embedding <=> $1::VECTOR
     LIMIT $2`,
    [queryEmbedding, limit]
  );
  return rows;
}

export async function spendingMemoryAnswer(question) {
  const db = getPool();
  if (!db) return null;
  const q = String(question || "").trim();
  const lower = q.toLowerCase();

  const semanticRows = await vectorSearch(q, 8);
  const semanticTotal = semanticRows.reduce((a, r) => a + Number(r.amount || 0), 0);

  const isCoffee = /咖啡|coffee|luckin|starbucks|瑞幸|星巴克/.test(lower);
  const isDelivery = /外卖|delivery|takeout|美团|饿了么|餐饮/.test(lower);
  const isLastMonth = /上个月|last month/.test(lower);
  const isThisMonth = /这个月|本月|this month/.test(lower);
  const isSummary = /总结|summary|习惯|habit|分析|analy/.test(lower);

  let where = "TRUE";
  const params = [];
  if (isLastMonth || isThisMonth) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + (isLastMonth ? -1 : 0), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + (isLastMonth ? 0 : 1), 1);
    params.push(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    where += ` AND r.tx_date >= $${params.length - 1} AND r.tx_date < $${params.length}`;
  }
  if (isCoffee) {
    params.push("%咖啡%", "%coffee%", "%瑞幸%", "%星巴克%", "%luckin%", "%starbucks%");
    where += ` AND (lower(i.name) LIKE lower($${params.length - 5}) OR lower(i.name) LIKE lower($${params.length - 4}) OR lower(r.merchant) LIKE lower($${params.length - 3}) OR lower(r.merchant) LIKE lower($${params.length - 2}) OR lower(r.merchant) LIKE lower($${params.length - 1}) OR lower(r.merchant) LIKE lower($${params.length}))`;
  } else if (isDelivery) {
    params.push("餐饮外卖");
    where += ` AND i.category = $${params.length}`;
  }

  if (isSummary) {
    const { rows } = await db.query(`
      SELECT i.category, count(*)::INT AS count, sum(i.amount)::FLOAT8 AS total
      FROM receipt_items i
      JOIN receipts r ON r.id = i.receipt_id
      WHERE ${where}
      GROUP BY i.category
      ORDER BY total DESC
      LIMIT 5
    `, params);
    const total = rows.reduce((a, r) => a + Number(r.total), 0);
    return {
      answer: rows.length
        ? `最近账本里最主要的消费是 ${rows[0].category}（¥${rows[0].total.toFixed(2)}）。前 ${rows.length} 类合计 ¥${total.toFixed(2)}。向量检索还找到了 ${semanticRows.length} 条语义相近明细，可作为消费记忆证据。`
        : "还没有足够账目可总结。先扫几张小票试试。",
      rows,
      semanticRows,
      mode: "category_summary_with_vector_memory",
    };
  }

  const { rows } = await db.query(`
    SELECT count(DISTINCT r.id)::INT AS receipts,
           count(i.id)::INT AS items,
           COALESCE(sum(i.amount), 0)::FLOAT8 AS total,
           min(r.tx_date)::STRING AS first_date,
           max(r.tx_date)::STRING AS last_date
    FROM receipt_items i
    JOIN receipts r ON r.id = i.receipt_id
    WHERE ${where}
  `, params);
  const r = rows[0];
  const subject = isCoffee ? "咖啡相关消费" : isDelivery ? "餐饮外卖" : "匹配消费";
  const period = isLastMonth ? "上个月" : isThisMonth ? "这个月" : "账本中";
  const sqlFound = Number(r.items) > 0;
  return {
    answer: sqlFound
      ? `${period}共有 ${r.items} 条${subject}明细，涉及 ${r.receipts} 张小票，合计 ¥${Number(r.total).toFixed(2)}。另外 CockroachDB 向量索引按语义召回了 ${semanticRows.length} 条相关消费记忆（前几条合计 ¥${semanticTotal.toFixed(2)}）。`
      : `没有找到严格匹配的${subject}，但 CockroachDB 向量索引按语义召回了 ${semanticRows.length} 条相近消费记忆（前几条合计 ¥${semanticTotal.toFixed(2)}）。`,
    rows,
    semanticRows,
    mode: "aggregate_with_vector_memory",
  };
}
