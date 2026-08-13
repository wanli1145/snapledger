import { useCallback, useEffect, useRef, useState } from "react";
import ReceiptCard from "./ReceiptCard.jsx";
import { DEMO_RECEIPTS, localizedDemo } from "../lib/demoData.js";
import { useLocale } from "../lib/i18n.jsx";

// 客户端压图：长边不超过 2000px，JPEG 输出，控制上传体积与识别成本
async function downscaleImage(file, maxEdge = 2000) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // PNG 透明底转白底
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.split(",")[1], dataUrl, mediaType: "image/jpeg" };
}

export default function ScanView({ onSave }) {
  const { locale, isEnglish } = useLocale();
  const [phase, setPhase] = useState("idle"); // idle | scanning | confirm
  const [preview, setPreview] = useState(null); // dataUrl 或 demo 小票对象
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  // 竞态防护：请求序号 + 在途请求/定时器句柄。任何新扫描或取消都会使旧的作废。
  const seqRef = useRef(0);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      // 组件卸载：中止在途请求、清掉演示定时器，避免卸载后 setState
      seqRef.current += 1;
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    },
    []
  );

  const scanFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError(isEnglish ? "Choose a JPG or PNG image." : "请选择一张图片文件（JPG / PNG 均可）。");
      return;
    }
    const seq = ++seqRef.current;
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setPhase("scanning");
    try {
      const img = await downscaleImage(file);
      if (seq !== seqRef.current) return;
      setPreview({ type: "photo", dataUrl: img.dataUrl });
      const resp = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: img.base64, mediaType: img.mediaType }),
        signal: ac.signal,
      });
      const data = await resp.json();
      if (seq !== seqRef.current) return;
      if (!resp.ok) {
        setPhase("idle");
        setPreview(null);
        setError(data.message || (isEnglish ? "Recognition failed. Try again." : "识别失败，请重试。"));
        return;
      }
      if (!data.receipt.items || data.receipt.items.length === 0) {
        setPhase("idle");
        setPreview(null);
        setError(
          data.receipt.confidence_note ||
            (isEnglish ? "No line items were found. Make sure the image is a receipt." : "没有从这张图片里读到账目，请确认拍的是小票。")
        );
        return;
      }
      setParsed(data.receipt);
      setPhase("confirm");
    } catch (e) {
      if (e.name === "AbortError" || seq !== seqRef.current) return;
      console.error(e);
      setPhase("idle");
      setPreview(null);
      setError(isEnglish ? "Something went wrong during recognition. Try again." : "识别过程出错，请重试。");
    }
  }, [isEnglish]);

  function scanDemo(demo) {
    const seq = ++seqRef.current;
    setError(null);
    setPreview({ type: "demo", demo });
    setPhase("scanning");
    // 演示模式：本地假扫描，1.8 秒后返回预置结果——无 API key 也能完整演示
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (seq !== seqRef.current) return;
      setParsed(structuredClone(demo.parsed));
      setPhase("confirm");
    }, 1800);
  }

  function cancelScan() {
    seqRef.current += 1;
    abortRef.current?.abort();
    clearTimeout(timerRef.current);
    setPhase("idle");
    setPreview(null);
  }

  function reset() {
    seqRef.current += 1;
    clearTimeout(timerRef.current);
    setPhase("idle");
    setPreview(null);
    setParsed(null);
  }

  if (phase === "confirm" && parsed) {
    return (
      <ReceiptCard
        parsed={parsed}
        onCancel={reset}
        onSave={(receipt) => {
          onSave(receipt);
          reset();
        }}
      />
    );
  }

  return (
    <div className="scan-view">
      <section
        className={`dropzone ${dragOver ? "drag-over" : ""} ${phase === "scanning" ? "busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (phase !== "scanning") setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // 扫描中不接受新的拖放，避免并发识别错配
          if (phase === "scanning") return;
          scanFile(e.dataTransfer.files?.[0]);
        }}
      >
        {phase === "scanning" ? (
          <div className="scanning-stage">
            {preview?.type === "photo" ? (
              <div className="scan-frame">
                <img src={preview.dataUrl} alt={isEnglish ? "Receipt awaiting recognition" : "待识别的小票"} />
                <div className="scan-beam" aria-hidden="true" />
              </div>
            ) : (
              <div className="scan-frame demo-frame">
                {preview?.demo && <DemoPaper demo={preview.demo} />}
                <div className="scan-beam" aria-hidden="true" />
              </div>
            )}
            <p className="scanning-text" role="status">
              {isEnglish ? "Reading the receipt line by line…" : "正在逐行识读小票…"}
            </p>
            <button className="btn ghost small" onClick={cancelScan}>
              {isEnglish ? "Cancel" : "取消"}
            </button>
          </div>
        ) : (
          <>
            <div className="dropzone-art" aria-hidden="true">🧾</div>
            <h2>{isEnglish ? "Drop a receipt here, or" : "把小票拖进来，或"}</h2>
            <div className="dropzone-actions">
              <button
                className="btn primary"
                onClick={() => fileRef.current?.click()}
              >
                {isEnglish ? "Choose a photo" : "选择照片"}
              </button>
            </div>
            <p className="dropzone-hint">
              {isEnglish
                ? "JPG / PNG · Wrinkled, tilted, or dim is fine · Photos are used only for this scan"
                : "支持 JPG / PNG · 皱了、斜了、光线差都能认 · 照片只用于本次识别"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                scanFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </>
        )}
      </section>

      {error && (
        <div className="error-bar" role="alert">
          <span>{error}</span>
          <button className="btn ghost small" onClick={() => setError(null)}>
            {isEnglish ? "Dismiss" : "知道了"}
          </button>
        </div>
      )}

      {phase !== "scanning" && (
        <section className="demo-shelf">
          <div className="demo-shelf-head">
            <h3>{isEnglish ? "No receipt? Try a demo" : "没带小票？先扫一张演示票"}</h3>
            <p>{isEnglish ? "Demo receipts work offline and show the complete flow" : "演示票不走网络请求，评委断网也能看完整流程"}</p>
          </div>
          <div className="demo-grid">
            {DEMO_RECEIPTS.map((sourceDemo) => {
              const demo = localizedDemo(sourceDemo, locale);
              return (
              <button
                key={demo.id}
                className="demo-card"
                onClick={() => scanDemo(demo)}
              >
                <DemoPaper demo={demo} compact />
                <span className="demo-card-label">
                  {demo.label}
                  <em>{demo.hint}</em>
                </span>
              </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// 用 CSS 画一张热敏小票（演示票的"照片"）
function DemoPaper({ demo, compact }) {
  const { isEnglish } = useLocale();
  const rows = compact ? demo.parsed.items.slice(0, 3) : demo.parsed.items;
  return (
    <div className={`paper ${compact ? "paper-compact" : ""}`}>
      <div className="paper-head">{demo.merchant}</div>
      <div className="paper-rule" />
      {rows.map((it, i) => (
        <div className="paper-row" key={i}>
          <span className="paper-name">{it.name}</span>
          <span className="paper-amt">{it.amount.toFixed(2)}</span>
        </div>
      ))}
      {compact && demo.parsed.items.length > 3 && (
        <div className="paper-row muted">
          <span className="paper-name">…</span>
        </div>
      )}
      <div className="paper-rule" />
      <div className="paper-row total">
        <span className="paper-name">{isEnglish ? "TOTAL" : "合计"}</span>
        <span className="paper-amt">¥{demo.parsed.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
