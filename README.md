# Sentinel Risk Intelligence — Kimi 2.6 Integration

Production-grade AI-powered mortgage underwriting and commercial lending due diligence platform, integrated with **Moonshot AI Kimi 2.6** LLM and **KimiVision** multimodal OCR.

**Live Deployment:**
- Frontend: https://oudwlnko4ckx6.kimi.page
- Backend: https://sentinel-risk-intelligence-kimi.clawson444.workers.dev

## Architecture

```
Frontend (Kimi Static Hosting)          Backend (Cloudflare Worker Edge)
+---------------------------+          +--------------------------------+
|  React 19 + TypeScript    | <----> |  Kimi 2.6 Chat Completions     |
|  Vite + Tailwind CSS      |  CORS  |  KimiVision OCR Extraction     |
|  shadcn/ui components     |        |  Structured JSON Parsing       |
+---------------------------+        +--------------------------------+
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Health check |
| `/api/chat` | POST | Chat with Kimi 2.6 (Tyler AI) |
| `/api/ocr` | POST | KimiVision document extraction |
| `/api/vision` | POST | Multimodal vision analysis |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, react-router-dom
- **Backend:** Cloudflare Worker (Service Worker format), Edge-deployed
- **AI:** Moonshot AI Kimi 2.6 (1M context, temperature=1.0 enforced)
- **OCR:** KimiVision multimodal extraction (PNG/JPEG/WEBP, max 10MB)

## Quick Start

```bash
npm install
npm run dev
```

## Environment

```bash
cp .env.example .env
# Add your KIMI_API_KEY from https://platform.moonshot.ai/
```

Powered by [Moonshot AI Kimi 2.6](https://platform.moonshot.ai/)
