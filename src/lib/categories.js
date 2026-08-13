// 分类定义。颜色采用经过 CVD（色觉缺陷）校验的固定色序调色板——
// 顺序即身份，绝不按排名重新分配；「其他」用弱化灰并始终带文字标签。
export const CATEGORIES = [
  { key: "食品生鲜", labelEn: "Groceries", color: "#2a78d6", icon: "🥬" },
  { key: "餐饮外卖", labelEn: "Dining & delivery", color: "#eb6834", icon: "🍜" },
  { key: "日用百货", labelEn: "Household", color: "#1baf7a", icon: "🧻" },
  { key: "交通出行", labelEn: "Transport", color: "#eda100", icon: "🚇" },
  { key: "服饰美妆", labelEn: "Fashion & beauty", color: "#e87ba4", icon: "👕" },
  { key: "医疗健康", labelEn: "Health", color: "#008300", icon: "💊" },
  { key: "娱乐休闲", labelEn: "Entertainment", color: "#4a3aa7", icon: "🎬" },
  { key: "其他", labelEn: "Other", color: "#898781", icon: "📦" },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

const byKey = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryOf(key) {
  return byKey.get(key) || byKey.get("其他");
}

export function categoryLabel(category, locale) {
  return locale === "en" ? category.labelEn : category.key;
}

export function formatYuan(n, locale = "zh") {
  const v = Number(n) || 0;
  return v.toLocaleString(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
