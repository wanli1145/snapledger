import { useMemo, useState } from "react";
import { CATEGORIES, categoryLabel, categoryOf, formatYuan } from "../lib/categories.js";
import { useLocale } from "../lib/i18n.jsx";

// 识别结果确认页：结果以热敏小票形态呈现，可逐行修正，保存时盖「已入账」印章
export default function ReceiptCard({ parsed, onCancel, onSave }) {
  const { locale, isEnglish } = useLocale();
  const [merchant, setMerchant] = useState(parsed.merchant || "");
  const [date, setDate] = useState(parsed.date || todayISO());
  const [items, setItems] = useState(
    parsed.items.map((it, i) => ({ ...it, _key: i }))
  );
  const [stamping, setStamping] = useState(false);

  const sum = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0),
    [items]
  );
  const scannedTotal = Number(parsed.total) || 0;
  // 按整数分比较，任何 ≥1 分的差额都报警（浮点安全）
  const mismatch =
    scannedTotal > 0 &&
    Math.round(sum * 100) !== Math.round(scannedTotal * 100);
  // 金额为空/非法/负数时禁止入账，而不是静默按 0 记
  const hasInvalid = items.some((it) => {
    const n = Number(it.amount);
    return it.amount === "" || !Number.isFinite(n) || n < 0;
  });

  function updateItem(key, patch) {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, ...patch } : it))
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it._key !== key));
  }

  function handleSave() {
    if (stamping || items.length === 0 || hasInvalid) return;
    setStamping(true);
    // 先盖章，1 秒后真正入账——仪式感即产品记忆点
    setTimeout(() => {
      onSave({
        merchant,
        date,
        total: Math.round(sum * 100) / 100,
        items: items.map(({ _key, ...it }) => ({
          ...it,
          amount: Number(it.amount) || 0,
        })),
      });
    }, 1000);
  }

  return (
    <div className="confirm-view">
      <div className="confirm-head">
        <h2>{isEnglish ? "Receipt recognized — please review" : "识别完成，核对一下"}</h2>
        <p>{isEnglish ? "Edit any item, amount, or category before booking it" : "点任意一行可以改名字、金额、分类——改完盖章入账"}</p>
      </div>

      <div className="receipt-wrap">
        <div className={`receipt ${stamping ? "receipt-stamping" : ""}`}>
          <div className="receipt-merchant">
            <input
              className="line-input merchant-input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={isEnglish ? "Merchant" : "商家名称"}
              aria-label={isEnglish ? "Merchant" : "商家名称"}
            />
          </div>
          <div className="receipt-meta">
            <input
              type="date"
              className="line-input date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={isEnglish ? "Transaction date" : "交易日期"}
            />
          </div>
          <div className="receipt-rule" />

          <ul className="receipt-items">
            {items.map((it) => {
              const cat = categoryOf(it.category);
              return (
                <li className="receipt-item" key={it._key}>
                  <div className="item-line">
                    <input
                      className="line-input item-name"
                      value={it.name}
                      onChange={(e) =>
                        updateItem(it._key, { name: e.target.value })
                      }
                      aria-label={isEnglish ? "Item name" : "商品名"}
                    />
                    <input
                      className="line-input item-amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={it.amount}
                      aria-invalid={
                        it.amount === "" ||
                        !Number.isFinite(Number(it.amount)) ||
                        Number(it.amount) < 0
                      }
                      onChange={(e) =>
                        updateItem(it._key, { amount: e.target.value })
                      }
                      aria-label={isEnglish ? "Amount" : "金额"}
                    />
                  </div>
                  <div className="item-sub">
                    <span
                      className="cat-dot"
                      style={{ background: cat.color }}
                      aria-hidden="true"
                    />
                    <select
                      className="cat-select"
                      value={it.category}
                      onChange={(e) =>
                        updateItem(it._key, { category: e.target.value })
                      }
                      aria-label={isEnglish ? "Category" : "分类"}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.icon} {categoryLabel(c, locale)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="item-remove"
                      onClick={() => removeItem(it._key)}
                      aria-label={isEnglish ? `Remove ${it.name}` : `删除 ${it.name}`}
                      title={isEnglish ? "Remove this item" : "删除这一行"}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="receipt-rule" />
          <div className="receipt-total">
            <span>{isEnglish ? "TOTAL" : "合计"}</span>
            <strong>¥{formatYuan(sum, locale)}</strong>
          </div>
          {hasInvalid && (
            <p className="mismatch-note" role="alert">
              {isEnglish ? "⚠ Fix the highlighted missing or invalid amount before booking" : "⚠ 有金额为空或非法（标红行），修正后才能入账"}
            </p>
          )}
          {mismatch && !hasInvalid && (
            <p className="mismatch-note" role="alert">
              {isEnglish
                ? `⚠ Line items do not match the scanned total of ¥${formatYuan(scannedTotal, locale)}`
                : `⚠ 各行之和与小票合计 ¥${formatYuan(scannedTotal, locale)} 不一致，请核对`}
            </p>
          )}
          {parsed.confidence_note && (
            <p className="confidence-note">💡 {parsed.confidence_note}</p>
          )}

          {stamping && (
            <div className="seal" aria-hidden="true">
              {isEnglish ? "BOOKED" : "已入账"}
            </div>
          )}
        </div>
      </div>

      <div className="confirm-actions">
        <button className="btn ghost" onClick={onCancel} disabled={stamping}>
          {isEnglish ? "Scan again" : "重新扫描"}
        </button>
        <button
          className="btn primary"
          onClick={handleSave}
          disabled={stamping || items.length === 0 || hasInvalid}
        >
          {stamping
            ? (isEnglish ? "Booking…" : "盖章中…")
            : (isEnglish ? `Book ¥${formatYuan(sum, locale)}` : `确认入账 ¥${formatYuan(sum, locale)}`)}
        </button>
      </div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
