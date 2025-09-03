
# Brain Index GEO — Monolithic TS Fastify + Prisma + BullMQ

Production-ready skeleton for AI Visibility analysis (ChatGPT/Google), with:
- Fastify API (`/api/analyzer`)
- BullMQ queue + Redis worker
- Prisma + PostgreSQL schema (`VisibilityScore`)
- Redis caching
- Dockerfile ready for Railway

## Quick start

```bash
cp .env.example .env
npm i
npm run prisma:generate
npm run migrate:dev
npm run dev          # API
npm run worker       # Queue worker (in another terminal)
```

### API

- `POST /api/analyzer/analyze` `{ "input": "Acme Inc" }` → `202 { jobId }`
- `GET  /api/analyzer/results/:id` → returns result or pending

### Notes

- ChatGPT scoring uses OpenAI API (set `OPENAI_API_KEY`).
- Google check is mocked; replace with SERP/Custom Search.
- Rate limiting via BullMQ limiter; caching via Redis (`CACHE_TTL`).

MIT
