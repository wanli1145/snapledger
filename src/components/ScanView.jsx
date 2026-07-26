import { useCallback, useRef, useState } from "react";
import ReceiptCard from "./ReceiptCard.jsx";
import { DEMO_RECEIPTS } from "../lib/demoData.js";

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
  const [phase, setPhase] = useState("idle"); // idle | scanning | confirm
  const [preview, setPreview] = useState(null); // dataUrl 或 demo 小票对象
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const scanFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("请选择一张图片文件（JPG / PNG / HEIC 截图均可）。");
      return;
    }
    setError(null);
    setPhase("scanning");
    try {
      const img = await downscaleImage(file);
      setPreview({ type: "photo", dataUrl: img.dataUrl });
      const resp = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: img.base64, mediaType: img.mediaType }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setPhase("idle");
        setPreview(null);
        setError(data.message || "识别失败，请重试。");
        return;
      }
      if (!data.receipt.items || data.receipt.items.length === 0) {
        setPhase("idle");
        setPreview(null);
        setError(
          data.receipt.confidence_note ||
            "没有从这张图片里读到账目，请确认拍的是小票。"
        );
        return;
      }
      setParsed(data.receipt);
      setPhase("confirm");
    } catch (e) {
      console.error(e);
      setPhase("idle");
      setPreview(null);
      setError("识别过程出错，请重试。");
    }
  }, []);

  function scanDemo(demo) {
    setError(null);
    setPreview({ type: "demo", demo });
    setPhase("scanning");
    // 演示模式：本地假扫描，1.8 秒后返回预置结果——无 API key 也能完整演示
    setTimeout(() => {
      setParsed(structuredClone(demo.parsed));
      setPhase("confirm");
    }, 1800);
  }

  function reset() {
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
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          scanFile(e.dataTransfer.files?.[0]);
        }}
      >
        {phase === "scanning" ? (
          <div className="scanning-stage">
            {preview?.type === "photo" ? (
              <div className="scan-frame">
                <img src={preview.dataUrl} alt="待识别的小票" />
                <div className="scan-beam" aria-hidden="true" />
              </div>
            ) : (
              <div className="scan-frame demo-frame">
                <DemoPaper demo={preview.demo} />
                <div className="scan-beam" aria-hidden="true" />
              </div>
            )}
            <p className="scanning-text">正在逐行识读小票…</p>
          </div>
        ) : (
          <>
            <div className="dropzone-art" aria-hidden="true">🧾</div>
            <h2>把小票拖进来，或</h2>
            <div className="dropzone-actions">
              <button
                className="btn primary"
                onClick={() => fileRef.current?.click()}
              >
                选择照片
              </button>
            </div>
            <p className="dropzone-hint">
              支持 JPG / PNG · 皱了、斜了、光线差都能认 · 照片只用于本次识别
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
            知道了
          </button>
        </div>
      )}

      {phase !== "scanning" && (
        <section className="demo-shelf">
          <div className="demo-shelf-head">
            <h3>没带小票？先扫一张演示票</h3>
            <p>演示票不走网络请求，评委断网也能看完整流程</p>
          </div>
          <div className="demo-grid">
            {DEMO_RECEIPTS.map((demo) => (
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// 用 CSS 画一张热敏小票（演示票的"照片"）
function DemoPaper({ demo, compact }) {
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
        <span className="paper-name">合计</span>
        <span className="paper-amt">¥{demo.parsed.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
