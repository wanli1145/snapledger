import { useMemo, useState } from "react";
import { CATEGORIES, categoryOf, formatYuan } from "../lib/categories.js";

// 识别结果确认页：结果以热敏小票形态呈现，可逐行修正，保存时盖「已入账」印章
export default function ReceiptCard({ parsed, onCancel, onSave }) {
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
  const mismatch = Math.abs(sum - scannedTotal) > 0.01 && scannedTotal > 0;

  function updateItem(key, patch) {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, ...patch } : it))
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it._key !== key));
  }

  function handleSave() {
    if (stamping || items.length === 0) return;
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
        <h2>识别完成，核对一下</h2>
        <p>点任意一行可以改名字、金额、分类——改完盖章入账</p>
      </div>

      <div className="receipt-wrap">
        <div className={`receipt ${stamping ? "receipt-stamping" : ""}`}>
          <div className="receipt-merchant">
            <input
              className="line-input merchant-input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="商家名称"
              aria-label="商家名称"
            />
          </div>
          <div className="receipt-meta">
            <input
              type="date"
              className="line-input date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="交易日期"
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
                      aria-label="商品名"
                    />
                    <input
                      className="line-input item-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.amount}
                      onChange={(e) =>
                        updateItem(it._key, { amount: e.target.value })
                      }
                      aria-label="金额"
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
                      aria-label="分类"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.icon} {c.key}
                        </option>
                      ))}
                    </select>
                    <button
                      className="item-remove"
                      onClick={() => removeItem(it._key)}
                      aria-label={`删除 ${it.name}`}
                      title="删除这一行"
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
            <span>合计</span>
            <strong>¥{formatYuan(sum)}</strong>
          </div>
          {mismatch && (
            <p className="mismatch-note" role="alert">
              ⚠ 各行之和与小票合计 ¥{formatYuan(scannedTotal)} 不一致，请核对
            </p>
          )}
          {parsed.confidence_note && (
            <p className="confidence-note">💡 {parsed.confidence_note}</p>
          )}

          {stamping && (
            <div className="seal" aria-hidden="true">
              已入账
            </div>
          )}
        </div>
      </div>

      <div className="confirm-actions">
        <button className="btn ghost" onClick={onCancel} disabled={stamping}>
          重新扫描
        </button>
        <button
          className="btn primary"
          onClick={handleSave}
          disabled={stamping || items.length === 0}
        >
          {stamping ? "盖章中…" : `确认入账 ¥${formatYuan(sum)}`}
        </button>
      </div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
