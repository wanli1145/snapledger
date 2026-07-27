import { useEffect, useRef, useState } from "react";
import ScanView from "./components/ScanView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { formatYuan } from "./lib/categories.js";
import { loadTransactions, saveTransactions, clearDemoData, makeId } from "./lib/store.js";

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
  const [view, setView] = useState("scan");
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [cloudStatus, setCloudStatus] = useState("checking"); // checking | online | local
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
        const data = await jsonFetch("/api/transactions");
        if (cancelled) return;
        if (data.transactions?.length) {
          setTransactions(data.transactions);
        } else {
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
      merchant: receipt.merchant || "未知商家",
      total: receipt.total,
      items: receipt.items,
      source: receipt.source || "scan",
      createdAt: Date.now(),
    };

    let record = localRecord;
    let cloudSaved = false;
    if (cloudStatus === "online") {
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
      message: `已入账 ¥${formatYuan(receipt.total)} · ${record.merchant}${cloudSaved ? " · 已写入 CockroachDB" : ""}`,
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
    if (cloudStatus === "online") {
      jsonFetch(`/api/transactions/${id}`, { method: "DELETE" }).catch((e) =>
        console.warn("cloud delete failed:", e.message)
      );
    }
    setToast({
      message: "已删除一条账单",
      action: {
        label: "撤销",
        fn: async () => {
          const saved = lastDeletedRef.current;
          if (saved) {
            let restored = saved.record;
            if (cloudStatus === "online") {
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
            ? "CockroachDB 云端记忆层已连接"
            : "本地存储 · 数据不出你的浏览器"}
        </span>
        <span>识别引擎：Claude 视觉模型</span>
      </footer>
    </div>
  );
}
