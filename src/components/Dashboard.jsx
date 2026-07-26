import { useMemo, useState } from "react";
import { CATEGORIES, categoryOf, formatYuan } from "../lib/categories.js";

function monthKeyOf(dateStr) {
  return (dateStr || "").slice(0, 7);
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

export default function Dashboard({ transactions, onRemove, onClearDemo }) {
  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKeyOf(t.date)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(
    months.includes(currentMonth) ? currentMonth : months[0] || currentMonth
  );
  const activeMonth = months.includes(month) ? month : months[0] || currentMonth;

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === activeMonth),
    [transactions, activeMonth]
  );

  const prevMonthKey = useMemo(() => {
    const [y, m] = activeMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [activeMonth]);

  const prevTotal = useMemo(
    () =>
      transactions
        .filter((t) => monthKeyOf(t.date) === prevMonthKey)
        .reduce((a, t) => a + (Number(t.total) || 0), 0),
    [transactions, prevMonthKey]
  );

  const total = monthTx.reduce((a, t) => a + (Number(t.total) || 0), 0);
  const count = monthTx.length;
  const daysElapsed = useMemo(() => {
    const [y, m] = activeMonth.split("-").map(Number);
    const now = new Date();
    if (now.getFullYear() === y && now.getMonth() + 1 === m) return now.getDate();
    return new Date(y, m, 0).getDate();
  }, [activeMonth]);
  const perDay = daysElapsed > 0 ? total / daysElapsed : 0;
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  // 按分类聚合（逐条明细，不是整单归类）
  const catSums = useMemo(() => {
    const map = new Map();
    for (const t of monthTx) {
      for (const it of t.items || []) {
        const k = categoryOf(it.category).key;
        map.set(k, (map.get(k) || 0) + (Number(it.amount) || 0));
      }
    }
    return CATEGORIES.map((c) => ({ ...c, value: map.get(c.key) || 0 }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  // 按日聚合（趋势图）
  const daily = useMemo(() => {
    const [y, m] = activeMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const arr = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      value: 0,
    }));
    for (const t of monthTx) {
      const d = Number((t.date || "").slice(8, 10));
      if (d >= 1 && d <= daysInMonth) arr[d - 1].value += Number(t.total) || 0;
    }
    return arr.slice(0, daysElapsed);
  }, [monthTx, activeMonth, daysElapsed]);

  const hasDemo = transactions.some((t) => t.source === "demo");

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-art" aria-hidden="true">🧾</div>
        <h2>账本还是空的</h2>
        <p>去「扫一扫」拍下第一张小票，或扫一张演示票看看效果。</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dash-toolbar">
        <div className="month-picker" role="tablist" aria-label="选择月份">
          {months.slice(0, 4).map((mk) => (
            <button
              key={mk}
              role="tab"
              aria-selected={mk === activeMonth}
              className={mk === activeMonth ? "month-btn active" : "month-btn"}
              onClick={() => setMonth(mk)}
            >
              {monthLabel(mk)}
            </button>
          ))}
        </div>
        {hasDemo && (
          <button className="btn ghost small" onClick={onClearDemo}>
            清除演示数据
          </button>
        )}
      </div>

      <section className="stat-row">
        <StatTile label="本月支出" value={`¥${formatYuan(total)}`} hero />
        <StatTile label="记账笔数" value={`${count} 笔`} />
        <StatTile label="日均支出" value={`¥${formatYuan(perDay)}`} />
        <StatTile
          label="环比上月"
          value={
            delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`
          }
          tone={delta === null ? "" : delta > 0 ? "bad" : "good"}
        />
      </section>

      <section className="chart-grid">
        <div className="card">
          <h3 className="card-title">分类构成</h3>
          <CategoryBars data={catSums} total={total} />
        </div>
        <div className="card">
          <h3 className="card-title">每日支出</h3>
          <TrendChart data={daily} monthKey={activeMonth} />
        </div>
      </section>

      <section className="card tx-card">
        <h3 className="card-title">账单明细</h3>
        <TransactionList list={monthTx} onRemove={onRemove} />
      </section>
    </div>
  );
}

function StatTile({ label, value, hero, tone }) {
  return (
    <div className={`stat-tile ${hero ? "hero" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone || ""}`}>{value}</span>
    </div>
  );
}

// 分类横条：每行都有名称 + 金额直接标签，颜色只是身份的冗余通道
function CategoryBars({ data, total }) {
  if (data.length === 0) return <p className="chart-empty">本月还没有明细</p>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <ul className="cat-bars">
      {data.map((c) => (
        <li className="cat-bar-row" key={c.key}>
          <span className="cat-bar-name">
            <span className="cat-dot" style={{ background: c.color }} aria-hidden="true" />
            {c.icon} {c.key}
          </span>
          <span className="cat-bar-track">
            <span
              className="cat-bar-fill"
              style={{ width: `${(c.value / max) * 100}%`, background: c.color }}
            />
          </span>
          <span className="cat-bar-val">
            ¥{formatYuan(c.value)}
            <em>{total > 0 ? `${((c.value / total) * 100).toFixed(0)}%` : ""}</em>
          </span>
        </li>
      ))}
    </ul>
  );
}

// 单序列日支出趋势：手写 SVG，2px 线 + 悬停十字线 + 提示框
function TrendChart({ data, monthKey }) {
  const [hover, setHover] = useState(null);
  const W = 520;
  const H = 200;
  const PAD = { top: 16, right: 12, bottom: 26, left: 44 };

  if (data.length === 0) return <p className="chart-empty">本月还没有记录</p>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const niceMax = niceCeil(maxV);
  const x = (i) =>
    PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  const ticks = [0, niceMax / 2, niceMax];

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHover(idx);
  }

  const hoverD = hover !== null ? data[hover] : null;

  return (
    <div className="trend-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="trend-svg"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${monthLabel(monthKey)}每日支出趋势`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="grid-line"
            />
            <text x={PAD.left - 6} y={y(t) + 4} className="axis-text" textAnchor="end">
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : Math.round(t)}
            </text>
          </g>
        ))}
        <path d={areaPath} className="trend-area" />
        <path d={linePath} className="trend-line" />

        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text key={i} x={x(i)} y={H - 8} className="axis-text" textAnchor="middle">
              {data[i].day} 日
            </text>
          ))}

        {hoverD && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="crosshair"
            />
            <circle cx={x(hover)} cy={y(hoverD.value)} r="4" className="hover-dot" />
          </g>
        )}
      </svg>
      {hoverD && (
        <div
          className="trend-tooltip"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <span>{Number(monthKey.slice(5))} 月 {hoverD.day} 日</span>
          <strong>¥{formatYuan(hoverD.value)}</strong>
        </div>
      )}
    </div>
  );
}

function niceCeil(v) {
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function TransactionList({ list, onRemove }) {
  const sorted = [...list].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
  );
  if (sorted.length === 0) return <p className="chart-empty">本月还没有账单</p>;

  let lastDate = null;
  return (
    <ul className="tx-list">
      {sorted.map((t) => {
        const showDate = t.date !== lastDate;
        lastDate = t.date;
        const mainCat = categoryOf(t.items?.[0]?.category);
        return (
          <li key={t.id}>
            {showDate && <div className="tx-date">{t.date}</div>}
            <div className="tx-row">
              <span className="cat-dot big" style={{ background: mainCat.color }} aria-hidden="true" />
              <div className="tx-main">
                <span className="tx-merchant">
                  {t.merchant}
                  {t.source === "demo" && <i className="demo-chip">演示</i>}
                </span>
                <span className="tx-sub">
                  {mainCat.icon} {mainCat.key}
                  {t.items?.length > 1 ? ` 等 ${t.items.length} 项` : ""}
                </span>
              </div>
              <span className="tx-amount">-¥{formatYuan(t.total)}</span>
              <button
                className="tx-remove"
                onClick={() => onRemove(t.id)}
                aria-label={`删除 ${t.merchant} 的账单`}
                title="删除"
              >
                ✕
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
