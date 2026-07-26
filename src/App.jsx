import { useEffect, useRef, useState } from "react";
import ScanView from "./components/ScanView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { formatYuan } from "./lib/categories.js";
import { loadTransactions, saveTransactions, clearDemoData, makeId } from "./lib/store.js";

export default function App() {
  const [view, setView] = useState("scan");
  const [transactions, setTransactions] = useState(() => loadTransactions());
  // toast: { message, action?: { label, fn } }
  const [toast, setToast] = useState(null);
  const lastDeletedRef = useRef(null);

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

  function addRecord(receipt) {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const record = {
      id: makeId(),
      date: receipt.date || iso,
      merchant: receipt.merchant || "未知商家",
      total: receipt.total,
      items: receipt.items,
      source: receipt.source || "scan",
      createdAt: Date.now(),
    };
    setTransactions((prev) => [record, ...prev]);
    setToast({ message: `已入账 ¥${formatYuan(receipt.total)} · ${record.merchant}` });
    setView("ledger");
  }

  // 删除支持撤销：先暂存，toast 里给「撤销」入口
  function removeRecord(id) {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      lastDeletedRef.current = { record: prev[idx], index: idx };
      return prev.filter((t) => t.id !== id);
    });
    setToast({
      message: "已删除一条账单",
      action: {
        label: "撤销",
        fn: () => {
          const saved = lastDeletedRef.current;
          if (saved) {
            setTransactions((prev) => {
              const next = [...prev];
              next.splice(Math.min(saved.index, next.length), 0, saved.record);
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
    setToast({ message: "演示数据已清除" });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-seal" aria-hidden="true">票</span>
          <div className="brand-text">
            <h1>小票管家</h1>
            <p>SnapLedger · 拍张小票，账就记好了</p>
          </div>
        </div>
        <nav className="tabs" aria-label="主导航">
          <button
            className={view === "scan" ? "tab active" : "tab"}
            aria-current={view === "scan" ? "page" : undefined}
            onClick={() => setView("scan")}
          >
            扫一扫
          </button>
          <button
            className={view === "ledger" ? "tab active" : "tab"}
            aria-current={view === "ledger" ? "page" : undefined}
            onClick={() => setView("ledger")}
          >
            账本
          </button>
        </nav>
      </header>

      <main>
        {view === "scan" ? (
          <ScanView onSave={addRecord} />
        ) : (
          <Dashboard
            transactions={transactions}
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
        <span>本地存储 · 数据不出你的浏览器</span>
        <span>识别引擎：Claude 视觉模型</span>
      </footer>
    </div>
  );
}
