import { useEffect, useState } from "react";
import ScanView from "./components/ScanView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { loadTransactions, saveTransactions, clearDemoData, makeId } from "./lib/store.js";

export default function App() {
  const [view, setView] = useState("scan");
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
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
    setToast(`已入账 ¥${Number(receipt.total).toFixed(2)} · ${record.merchant}`);
    setView("ledger");
  }

  function removeRecord(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function handleClearDemo() {
    setTransactions((prev) => clearDemoData(prev));
    setToast("演示数据已清除");
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
            onClick={() => setView("scan")}
          >
            扫一扫
          </button>
          <button
            className={view === "ledger" ? "tab active" : "tab"}
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
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <footer className="footer">
        <span>本地存储 · 数据不出你的浏览器</span>
        <span>识别引擎：Claude 视觉模型</span>
      </footer>
    </div>
  );
}
