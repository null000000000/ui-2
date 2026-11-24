# AXIOM — Social Intelligence & Telemetry

Monochrome social media monitoring and analytics cockpit built with React, TypeScript, Vite, Tailwind CSS, Recharts, and Motion.

Designed under the **AXIOM Obsidian Signal** visual language (strict black, white, and neutral gray palette) for monitoring owned accounts across **YouTube, TikTok, Instagram, Facebook, X, and LinkedIn**, powered by a typed REST adapter ready for your **n8n / Backend API**.

## Features

- **Calm Hover-to-Expand & Click-to-Pin UI**: Minimal surfaces at rest that expand smoothly after an intentional hover dwell (scroll-safe) or pin open immediately on click.
- **Strict Metric Provenance**: Preserves `null` vs `0` semantics, source API field labels, aggregation rules, and per-platform API boundaries.
- **City-Calibrated Audience Map**: Displays top viewer cities per region with exact coordinate pins on a dark monochrome world map.
- **Multi-Screen Analytics**: Overview, Content Library & Snapshot Timeline, Platform Analytics, Audience Insights, Cross-Platform Compare (Native & Base 100), Accounts + CSV Header Validator, n8n Sync Center, Evidence Signals, and Settings.

## Local Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

## Connecting n8n / Backend API

Copy `.env.example` to `.env` and set your API base URL:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL`: Base URL of your backend API (for example `http://127.0.0.1:3001`).

Expected JSON endpoints:
- `GET /api/health`
- `GET /api/integrations/accounts`
- `GET /api/analytics/content`
- `GET /api/analytics/timeseries`
- `GET /api/analytics/audience`
- `GET /api/synchronization/runs`

## Build & Typecheck

```bash
npm run lint
npm run build
```
