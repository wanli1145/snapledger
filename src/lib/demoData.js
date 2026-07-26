// 演示数据：三张可"扫描"的内置小票 + 一批种子账目。
// 种子账目相对"今天"生成、使用固定伪随机序列——每次打开仪表盘都真实好看且可复现。

export const DEMO_RECEIPTS = [
  {
    id: "demo-yonghui",
    label: "超市采购",
    merchant: "永辉超市（软件园店）",
    hint: "生鲜 + 日用混合小票",
    parsed: {
      merchant: "永辉超市（软件园店）",
      date: "",
      items: [
        { name: "特仑苏纯牛奶 250ml*12", amount: 49.9, quantity: 1, category: "食品生鲜" },
        { name: "鲜鸡蛋 30 枚", amount: 16.8, quantity: 1, category: "食品生鲜" },
        { name: "上海青 500g", amount: 3.58, quantity: 1, category: "食品生鲜" },
        { name: "西红柿 750g", amount: 6.72, quantity: 1, category: "食品生鲜" },
        { name: "维达抽纸 3 层*20 包", amount: 32.9, quantity: 1, category: "日用百货" },
        { name: "立白洗洁精 1.1kg", amount: 9.9, quantity: 1, category: "日用百货" },
      ],
      total: 119.8,
      confidence_note: "",
    },
  },
  {
    id: "demo-luckin",
    label: "咖啡小票",
    merchant: "瑞幸咖啡 luckin coffee",
    hint: "两杯下午茶",
    parsed: {
      merchant: "瑞幸咖啡（望京 SOHO 店）",
      date: "",
      items: [
        { name: "生椰拿铁（大杯/冰）", amount: 13.9, quantity: 1, category: "餐饮外卖" },
        { name: "冰吸生椰拿铁（大杯）", amount: 15.0, quantity: 1, category: "餐饮外卖" },
      ],
      total: 28.9,
      confidence_note: "",
    },
  },
  {
    id: "demo-711",
    label: "便利店",
    merchant: "7-ELEVEn 便利店",
    hint: "加班夜宵 + 电池",
    parsed: {
      merchant: "7-ELEVEn（国贸店）",
      date: "",
      items: [
        { name: "关东煮组合 4 串", amount: 12.0, quantity: 1, category: "餐饮外卖" },
        { name: "三明治（火腿芝士）", amount: 9.8, quantity: 1, category: "餐饮外卖" },
        { name: "农夫山泉 550ml", amount: 2.0, quantity: 1, category: "食品生鲜" },
        { name: "南孚电池 5 号 2 粒", amount: 12.9, quantity: 1, category: "日用百货" },
      ],
      total: 36.7,
      confidence_note: "",
    },
  },
];

// —— 种子账目 ————————————————————————————————————————————————

// mulberry32：固定种子的伪随机数，保证每台机器生成同一批演示账目
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MERCHANT_POOL = [
  { merchant: "盒马鲜生", category: "食品生鲜", min: 45, max: 220 },
  { merchant: "永辉超市", category: "食品生鲜", min: 30, max: 160 },
  { merchant: "美团外卖", category: "餐饮外卖", min: 18, max: 55 },
  { merchant: "瑞幸咖啡", category: "餐饮外卖", min: 9.9, max: 32 },
  { merchant: "海底捞", category: "餐饮外卖", min: 120, max: 380 },
  { merchant: "名创优品", category: "日用百货", min: 15, max: 80 },
  { merchant: "京东超市", category: "日用百货", min: 25, max: 150 },
  { merchant: "地铁通勤", category: "交通出行", min: 4, max: 12 },
  { merchant: "滴滴出行", category: "交通出行", min: 15, max: 68 },
  { merchant: "优衣库", category: "服饰美妆", min: 79, max: 399 },
  { merchant: "屈臣氏", category: "服饰美妆", min: 35, max: 180 },
  { merchant: "益丰大药房", category: "医疗健康", min: 20, max: 120 },
  { merchant: "万达影城", category: "娱乐休闲", min: 39, max: 98 },
  { merchant: "Keep 会员", category: "娱乐休闲", min: 25, max: 25 },
];

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildSeedTransactions() {
  const out = [];
  const today = new Date();

  for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
    // 每天独立种子：同一 day-offset 的抽取结果与运行日期无关，真正可复现
    const rand = mulberry32(20260726 + daysAgo);
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    // 每天 0~3 笔：周末略多
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const roll = rand();
    let count = roll < 0.18 ? 0 : roll < 0.62 ? 1 : roll < 0.9 ? 2 : 3;
    if (isWeekend && count > 0 && rand() < 0.5) count += 1;

    for (let i = 0; i < count; i++) {
      const pick = MERCHANT_POOL[Math.floor(rand() * MERCHANT_POOL.length)];
      const amount =
        Math.round((pick.min + rand() * (pick.max - pick.min)) * 100) / 100;
      out.push({
        id: `seed-${daysAgo}-${i}`,
        date: isoDate(d),
        merchant: pick.merchant,
        total: amount,
        items: [
          { name: pick.merchant, amount, quantity: 1, category: pick.category },
        ],
        source: "demo",
        createdAt: d.getTime(),
      });
    }
  }
  return out;
}
