import { buildSeedTransactions } from "./demoData.js";

const KEY = "snapledger.transactions.v1";
const SEED_FLAG = "snapledger.seeded.v1";

// localStorage 在隐私模式/配额满/被禁用时任何调用都可能抛错——全部包一层，
// 存储不可用时应用照常运行，只是不持久化。
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 静默降级 */
  }
}

// 每条记录做字段兜底，防御外部写入/旧版本残留的脏数据
function sanitize(list) {
  return list
    .filter((t) => t && typeof t === "object")
    .map((t) => ({
      id: t.id || `tx-${Math.random().toString(36).slice(2, 10)}`,
      date: typeof t.date === "string" ? t.date : "",
      merchant: t.merchant || "未知商家",
      total: Number(t.total) || 0,
      items: Array.isArray(t.items) ? t.items : [],
      source: t.source || "scan",
      createdAt: Number(t.createdAt) || 0,
    }));
}

export function loadTransactions() {
  const raw = safeGet(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // 合法 JSON 但不是数组（外部篡改/写坏）也视为损坏，落入重建
      if (Array.isArray(parsed)) return sanitize(parsed);
    } catch {
      /* 解析失败：备份损坏数据再重建，避免覆盖后无法救回 */
    }
    safeSet(`${KEY}.corrupt.${Date.now()}`, raw);
  }
  // 首次打开：注入演示账目，让仪表盘一打开就有内容
  if (!safeGet(SEED_FLAG)) {
    const seed = buildSeedTransactions();
    safeSet(KEY, JSON.stringify(seed));
    safeSet(SEED_FLAG, "1");
    return seed;
  }
  return [];
}

export function saveTransactions(list) {
  safeSet(KEY, JSON.stringify(list));
}

export function clearDemoData(list) {
  return list.filter((t) => t.source !== "demo");
}

export function makeId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
