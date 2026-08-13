import { useEffect, useState } from "react";
import { useLocale } from "../lib/i18n.jsx";

const EXAMPLES = {
  zh: ["这个月外卖花了多少？", "上个月买过几次咖啡？", "总结最近的消费习惯"],
  en: ["How much did I spend on delivery this month?", "How many coffees did I buy last month?", "Summarize my recent spending habits"],
};

async function askMemory(question, fallbackMessage) {
  const resp = await fetch("/api/memory/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || fallbackMessage);
  return data;
}

export default function MemoryAssistant({ cloudStatus }) {
  const { locale, isEnglish } = useLocale();
  const examples = EXAMPLES[locale];
  const [question, setQuestion] = useState(() => examples[0]);
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuestion(examples[0]);
    setAnswer(null);
    setError(null);
  }, [locale]);

  async function submit(e) {
    e?.preventDefault();
    if (!question.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await askMemory(question.trim(), isEnglish ? "Query failed" : "查询失败");
      setAnswer(data);
    } catch (err) {
      setError(err.message);
      setAnswer(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card memory-card">
      <div className="memory-head">
        <div>
          <h3 className="card-title">{isEnglish ? "Spending memory agent" : "消费记忆助手"}</h3>
          <p>
            {isEnglish
              ? "CockroachDB is the long-term memory layer, combining SQL aggregation with distributed vector search."
              : "用 CockroachDB 作为长期消费记忆层：SQL 聚合 + 向量索引 schema 已就绪，现在可以直接问账本。"}
          </p>
        </div>
        <span className={cloudStatus === "online" ? "memory-status online" : "memory-status"}>
          {cloudStatus === "online"
            ? (isEnglish ? "CockroachDB connected" : "CockroachDB 已连接")
            : (isEnglish ? "Local mode" : "本地模式")}
        </span>
      </div>

      <form className="memory-form" onSubmit={submit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={isEnglish ? "Ask your spending memory…" : "问问你的消费记忆，比如：这个月外卖花了多少？"}
          disabled={cloudStatus !== "online"}
        />
        <button className="btn primary" disabled={busy || cloudStatus !== "online"}>
          {busy ? (isEnglish ? "Searching…" : "查询中…") : (isEnglish ? "Ask memory" : "问账本")}
        </button>
      </form>

      <div className="memory-examples" aria-label={isEnglish ? "Example questions" : "示例问题"}>
        {examples.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuestion(q)}
            disabled={cloudStatus !== "online"}
          >
            {q}
          </button>
        ))}
      </div>

      {error && <p className="memory-error" role="alert">{error}</p>}
      {answer && (
        <div className="memory-answer">
          <strong>{answer.answer}</strong>
          {answer.rows?.length > 0 && (
            <details>
              <summary>{isEnglish ? "View query evidence" : "查看查询证据"}</summary>
              <pre>{JSON.stringify(answer.rows, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
