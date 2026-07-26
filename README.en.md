# 🧾 SnapLedger — Snap a receipt, and it's booked.

> AI-powered receipt scanning for effortless expense tracking.
> Photo in → line items extracted → auto-categorized → spending dashboard out.

**[中文版 README](README.md)** · MIT License

People don't abandon expense trackers because they're lazy — they abandon them because **every entry requires typing**. SnapLedger collapses bookkeeping into a single action: **take a photo of the receipt**. Everything else — reading every line item, categorizing it, totaling it, and charting where your money went — happens automatically.

## ✨ Features

- **📷 Scan** — Drag & drop or shoot a receipt photo. Wrinkled, tilted, poorly lit? Still works.
- **🏷️ Auto-categorization** — Every line item lands in one of 8 spending categories; one tap to correct.
- **🖋️ Stamp to book** — Results render as an editable thermal receipt; confirming slams a red "已入账" (BOOKED) seal on it. Bookkeeping with ceremony.
- **📊 Spending dashboard** — Monthly total, daily average, period-over-period delta, category breakdown, daily trend, transaction detail — one screen.
- **🔌 Offline demo mode** — Three built-in demo receipts run the full flow with zero network and zero API keys. Judges on hostile venue Wi-Fi? Covered.
- **🔒 Local-first** — The ledger lives in `localStorage`; photos are used for a single recognition call and never stored.
- **📱 Installable PWA** — "Add to Home Screen" on mobile; the app shell works offline after first load.

## 🏗️ Architecture

```
┌──────────────┐  photo (base64, client-side ≤2000px)  ┌──────────────┐
│  React SPA   │ ────────────────────────────────────▶ │   Express    │
│  Vite + SVG  │ ◀──────────────────────────────────── │   Node.js    │
└──────┬───────┘        structured ledger JSON          └──────┬───────┘
       │                                                       │ Messages API
  localStorage                                                 ▼ (vision + structured outputs)
  (ledger persistence)                                 Claude claude-opus-5
```

- **Recognition engine**: Anthropic Claude (`claude-opus-5`) vision + **structured outputs** (`output_config.format` with a JSON Schema). The model's response is guaranteed-valid ledger JSON — amounts are always numbers, categories always land in the enum. No brittle regex post-processing, ever. Server-side `fallbacks: "default"` reroutes false-positive safety refusals automatically.
- **Charts**: zero chart libraries — hand-written SVG/CSS. The categorical palette is **CVD-validated** (adjacent-pair color-vision-deficiency ΔE ≥ 8), every bar carries a direct text label, and the trend chart is operable by mouse, touch, and keyboard, with a screen-reader data table.
- **Frontend**: React 18 + Vite, responsive down to mobile, `prefers-reduced-motion` respected.

## 🚀 Quick Start

```bash
npm install
npm run dev        # landing page + app at http://localhost:5173, API at :3801
```

Open http://localhost:5173 — the landing page; click **打开应用 (Open App)**. **No API key needed to try the full flow with demo receipts.**

To scan real receipt photos, provide Anthropic credentials (either works):

```bash
# Option A: environment variable
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev

# Option B: if you've logged in with `ant auth login`, just run it —
# the SDK resolves the local profile automatically
```

Production (single process — any Node host, Railway/Render/Fly all work):

```bash
npm run build && npm start   # Express serves the built site + API on :3801
```

Static-only deploy (Netlify / Vercel / GitHub Pages): deploy `dist/` as-is — the landing page and the complete demo-receipt flow work without any backend; only real-photo scanning requires the API server.

## 📁 Project Layout

```
index.html                 # marketing landing page (static)
app.html                   # app entry
server/index.js            # Express: /api/parse-receipt (Claude vision)
src/App.jsx                # shell: nav, ledger state, undo-able toasts
src/components/
  ScanView.jsx             # upload/drag-drop, client-side downscale, scan animation, demo shelf
  ReceiptCard.jsx          # editable thermal-receipt confirmation + seal stamp
  Dashboard.jsx            # stat tiles, category bars, SVG daily trend, transactions
src/lib/
  categories.js            # category definitions + CVD-safe fixed-order palette
  demoData.js              # demo receipts + reproducible seed transactions
  store.js                 # defensive localStorage persistence
public/                    # PWA: manifest, service worker, icon
```

## 🎬 90-Second Demo (judge's view)

1. Open **扫一扫 (Scan)** → tap the "Supermarket run" demo receipt → a scan beam sweeps the paper (1.8 s)
2. Recognition results appear as a receipt → live-edit one item's category to show the human-in-the-loop design
3. Tap **确认入账 (Confirm)** → the red BOOKED seal stamps down → auto-navigate to the ledger
4. Dashboard tells the story in three sentences: monthly total, biggest category, the weekend spikes on the trend line
5. With network: shoot a real receipt on your phone and scan it live

Full pitch script: [PITCH.md](PITCH.md) (Chinese) · Video shooting script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md) (English VO)

## 🗺️ Roadmap

- Multi-currency & business-trip mode (receipts → one-click expense report)
- WeChat Pay / Alipay statement import, complementing receipt granularity
- Monthly AI spending review ("14 bubble teas this month — 5 more than last")
- Shared household ledgers

---

*Built for hackathon · Recognition by Claude · Data stays local*
