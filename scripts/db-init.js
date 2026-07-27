// 初始化/校验数据库结构：node --env-file=.env scripts/db-init.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { backfillEmbeddings } from "../server/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.COCKROACH_DATABASE_URL;
if (!url) {
  console.error("缺少 COCKROACH_DATABASE_URL（用 node --env-file=.env 运行）");
  process.exit(1);
}

const caPath = path.join(process.env.HOME || "", ".postgresql", "root.crt");
const client = new pg.Client({
  connectionString: url,
  ssl: fs.existsSync(caPath)
    ? { ca: fs.readFileSync(caPath, "utf8") }
    : { rejectUnauthorized: true },
});

const schema = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");

try {
  await client.connect();
  const { rows } = await client.query("SELECT version()");
  console.log("✅ 连接成功:", rows[0].version.split(" ").slice(0, 2).join(" "));

  await client.query(schema);
  console.log("✅ 表结构与向量索引已就绪");

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("📋 当前表:", tables.rows.map((r) => r.table_name).join(", "));

  const idx = await client.query(`SHOW INDEXES FROM receipt_items`);
  const hasVector = idx.rows.some((r) => r.index_name === "items_embedding_idx");
  console.log(hasVector ? "✅ 向量索引 items_embedding_idx 存在" : "⚠️ 向量索引缺失");

  const backfilled = await backfillEmbeddings();
  console.log(`✅ 已回填 ${backfilled} 条缺失 embedding 的明细`);
} finally {
  await client.end();
}
