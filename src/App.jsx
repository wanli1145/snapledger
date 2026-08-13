import { useEffect, useRef, useState } from "react";
import ScanView from "./components/ScanView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { formatYuan } from "./lib/categories.js";
import { loadTransactions, saveTransactions, clearDemoData, makeId } from "./lib/store.js";
import { useLocale } from "./lib/i18n.jsx";

async function jsonFetch(url, options = {}) {
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
}

export default function App() {
  const { locale, setLocale, isEnglish } = useLocale();
  const [view, setView] = useState("scan");
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [cloudStatus, setCloudStatus] = useState("checking"); // checking | online | local
  const [cloudWritable, setCloudWritable] = useState(false);
  // toast: { message, action?: { label, fn } }
  const [toast, setToast] = useState(null);
  const lastDeletedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCloud() {
      try {
        const status = await jsonFetch("/api/status");
        if (!status.hasDatabase) {
          if (!cancelled) setCloudStatus("local");
          return;
        }
        if (!cancelled) setCloudWritable(Boolean(status.cloudWritable));
        const data = await jsonFetch("/api/transactions");
        if (cancelled) return;
        if (data.transactions?.length) {
          setTransactions(data.transactions);
        } else if (status.cloudWritable) {
          // 首次云端为空：把本地种子/已有账本同步上去，作为 CockroachDB 记忆层初始数据
          const local = loadTransactions();
          if (local.length) await jsonFetch("/api/transactions/sync", {
            method: "POST",
            body: JSON.stringify({ transactions: local }),
          });
          const after = await jsonFetch("/api/transactions");
          if (!cancelled && after.transactions?.length) setTransactions(after.transactions);
        }
        if (!cancelled) setCloudStatus("online");
      } catch (e) {
        console.warn("cloud ledger unavailable:", e.message);
        if (!cancelled) setCloudStatus("local");
      }
    }
    loadCloud();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setToast(null);
      lastDeletedRef.current = null; // 超时后放弃撤销暂存
    }, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function addRecord(receipt) {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const localRecord = {
      id: makeId(),
      date: receipt.date || iso,
      merchant: receipt.merchant || (isEnglish ? "Unknown merchant" : "未知商家"),
      total: receipt.total,
      items: receipt.items,
      source: receipt.source || "scan",
      createdAt: Date.now(),
    };

    let record = localRecord;
    let cloudSaved = false;
    if (cloudStatus === "online" && cloudWritable) {
      try {
        const data = await jsonFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({ transaction: localRecord }),
        });
        record = data.transaction || localRecord;
        cloudSaved = true;
      } catch (e) {
        console.warn("cloud save failed:", e.message);
        setCloudStatus("local");
      }
    }

    setTransactions((prev) => [record, ...prev]);
    setToast({
      message: isEnglish
        ? `Booked ¥${formatYuan(receipt.total, locale)} · ${record.merchant}${cloudSaved ? " · Saved to CockroachDB" : ""}`
        : `已入账 ¥${formatYuan(receipt.total, locale)} · ${record.merchant}${cloudSaved ? " · 已写入 CockroachDB" : ""}`,
    });
    setView("ledger");
  }

  // 删除支持撤销：先暂存，toast 里给「撤销」入口
  async function removeRecord(id) {
    let deleted;
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      deleted = { record: prev[idx], index: idx };
      lastDeletedRef.current = deleted;
      return prev.filter((t) => t.id !== id);
    });
    if (cloudStatus === "online" && cloudWritable) {
      jsonFetch(`/api/transactions/${id}`, { method: "DELETE" }).catch((e) =>
        console.warn("cloud delete failed:", e.message)
      );
    }
    setToast({
      message: isEnglish ? "Transaction deleted" : "已删除一条账单",
      action: {
        label: isEnglish ? "Undo" : "撤销",
        fn: async () => {
          const saved = lastDeletedRef.current;
          if (saved) {
            let restored = saved.record;
            if (cloudStatus === "online" && cloudWritable) {
              try {
                const data = await jsonFetch("/api/transactions", {
                  method: "POST",
                  body: JSON.stringify({ transaction: saved.record }),
                });
                restored = data.transaction || saved.record;
              } catch (e) {
                console.warn("cloud restore failed:", e.message);
              }
            }
            setTransactions((prev) => {
              const next = [...prev];
              next.splice(Math.min(saved.index, next.length), 0, restored);
              return next;
            });
            lastDeletedRef.current = null;
          }
          setToast(null);
        },
      },
    });
  }

  function handleClearDemo() {
    setTransactions((prev) => clearDemoData(prev));
    setToast({ message: isEnglish ? "Demo data cleared" : "演示数据已清除" });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-seal" aria-hidden="true">{isEnglish ? "S" : "票"}</span>
          <div className="brand-text">
            <h1>{isEnglish ? "SnapLedger" : "小票管家"}</h1>
            <p>{isEnglish ? "Turn every receipt into memory" : "SnapLedger · 拍张小票，账就记好了"}</p>
          </div>
        </div>
        <div className="topbar-controls">
          <nav className="tabs" aria-label={isEnglish ? "Primary navigation" : "主导航"}>
            <button
              className={view === "scan" ? "tab active" : "tab"}
              aria-current={view === "scan" ? "page" : undefined}
              onClick={() => setView("scan")}
            >
              {isEnglish ? "Scan" : "扫一扫"}
            </button>
            <button
              className={view === "ledger" ? "tab active" : "tab"}
              aria-current={view === "ledger" ? "page" : undefined}
              onClick={() => setView("ledger")}
            >
              {isEnglish ? "Ledger" : "账本"}
            </button>
          </nav>
          <div className="language-switch" role="group" aria-label="Language">
            <button className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")} aria-pressed={locale === "zh"}>中文</button>
            <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
          </div>
        </div>
      </header>

      <main>
        {view === "scan" ? (
          <ScanView onSave={addRecord} />
        ) : (
          <Dashboard
            transactions={transactions}
            cloudStatus={cloudStatus}
            onRemove={removeRecord}
            onClearDemo={handleClearDemo}
            onGoScan={() => setView("scan")}
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast.message}
          {toast.action && (
            <button className="toast-action" onClick={toast.action.fn}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      <footer className="footer">
        <span>
          {cloudStatus === "online"
            ? isEnglish
              ? `CockroachDB memory connected${cloudWritable ? "" : " · Public demo is read-only"}`
              : `CockroachDB 云端记忆层已连接${cloudWritable ? "" : " · 公开演示只读"}`
            : isEnglish ? "Local storage · Data stays in your browser" : "本地存储 · 数据不出你的浏览器"}
        </span>
        <span>{isEnglish ? "Recognition: Claude vision" : "识别引擎：Claude 视觉模型"}</span>
      </footer>
    </div>
  );
}
