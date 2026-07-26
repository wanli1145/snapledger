import { buildSeedTransactions } from "./demoData.js";

const KEY = "snapledger.transactions.v1";
const SEED_FLAG = "snapledger.seeded.v1";

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* 损坏则重建 */
  }
  // 首次打开：注入演示账目，让仪表盘一打开就有内容
  if (!localStorage.getItem(SEED_FLAG)) {
    const seed = buildSeedTransactions();
    localStorage.setItem(KEY, JSON.stringify(seed));
    localStorage.setItem(SEED_FLAG, "1");
    return seed;
  }
  return [];
}

export function saveTransactions(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearDemoData(list) {
  return list.filter((t) => t.source !== "demo");
}

export function makeId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
