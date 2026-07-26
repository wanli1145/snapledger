// 分类定义。颜色采用经过 CVD（色觉缺陷）校验的固定色序调色板——
// 顺序即身份，绝不按排名重新分配；「其他」用弱化灰并始终带文字标签。
export const CATEGORIES = [
  { key: "食品生鲜", color: "#2a78d6", icon: "🥬" },
  { key: "餐饮外卖", color: "#eb6834", icon: "🍜" },
  { key: "日用百货", color: "#1baf7a", icon: "🧻" },
  { key: "交通出行", color: "#eda100", icon: "🚇" },
  { key: "服饰美妆", color: "#e87ba4", icon: "👕" },
  { key: "医疗健康", color: "#008300", icon: "💊" },
  { key: "娱乐休闲", color: "#4a3aa7", icon: "🎬" },
  { key: "其他", color: "#898781", icon: "📦" },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

const byKey = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryOf(key) {
  return byKey.get(key) || byKey.get("其他");
}

export function formatYuan(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
