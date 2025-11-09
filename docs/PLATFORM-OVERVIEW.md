# Brain Index GEO Platform - Overview

## 🎯 Product Concept

**Brain Index GEO** - модуль для индексации клиентского проекта в 5 AI систем:
- ChatGPT (OpenAI GPT-4)
- Gemini (Google)
- Grok (xAI)
- DeepSeek (DeepSeek V3)
- Mistral (Mistral Large)

## 💼 Business Model

**FREE Tier:**
- Анализ текущей видимости бренда во всех 5 AI
- Показываем реальные score от каждого провайдера
- Базовые рекомендации

**PRO Tier (€250K/year potential):**
- Модуль индексации клиентского проекта
- Оптимизация контента для AI систем
- Мониторинг видимости
- Техническая интеграция

## 🏗️ Architecture

### Frontend
- **Repo:** github.com/guannko/brain-index-site
- **Deployment:** Vercel
- **Domain:** brain-index.com
- **Stack:** HTML, CSS, JavaScript, Bootstrap

### Backend
- **Repo:** github.com/guannko/brain-index-geo-monolith
- **Deployment:** Railway (service: bubbly-elegance)
- **Stack:** Node.js, Fastify, TypeScript
- **Database:** Qdrant (vector DB for RAG)

### Infrastructure
- **Railway Projects:**
  - Backend: bubbly-elegance (brain-index-geo-monolith)
  - Qdrant: qdrant-ma8b (vector database)
- **Private Networking:** qdrant-ma8b.railway.internal:6333

## 🔄 Data Flow

```
User → brain-index.com (Vercel)
  ↓
Frontend (api.js) → POST /api/analyzer/analyze
  ↓
Backend (Railway) → 5 AI Providers (parallel)
  ↓
Results aggregation → Response to frontend
  ↓
Modal with 5 circular progress indicators
```

## 📊 Current Status

**Production:**
- ✅ Frontend deployed on Vercel
- ✅ Backend deployed on Railway
- ✅ All 5 AI providers initialized
- ✅ FREE tier shows all 5 AI results
- ⚠️ Qdrant connection issues (non-critical)

**Features:**
- ✅ Multi-provider AI analysis
- ✅ Circular progress visualization
- ✅ FREE/PRO tier routing
- ✅ Job queue system
- 🚧 RAG Pipeline (disabled due to Qdrant)

## 🎨 UI/UX

**Results Modal:**
- Large central circle: Overall AI Visibility Score
- 5 smaller circles: Individual AI provider scores
- Color-coded by provider
- Key insights section
- CTA: "Get Full Report" → pricing page

**Design Philosophy:**
- Clean, modern design
- Focus on data visualization
- Clear value proposition
- Simple user flow

## 🔑 Key Files

**Backend:**
- `src/index.ts` - Main server entry
- `src/modules/analyzer/provider-registry.ts` - Provider configuration
- `src/modules/analyzer/providers/` - AI provider implementations

**Frontend:**
- `js/api.js` - API integration & results display
- `index.html` - Landing page
- `css/brain-index.css` - Styling

## 🚀 Revenue Targets

- **OffersPSP:** €10K/month (casino/PSP platform)
- **Brain Index GEO:** €250K/year potential
- **Automation Products:** Custom €500-2K + SaaS €99/mo

## 👥 Team

- **Borys (CEO):** Business strategy, client relations
- **Jean Claude (AI CTO):** Technical execution, architecture

## 📝 Development Notes

**Partnership Since:** August 23, 2025
**Current Version:** v3.1 ULTIMATE
**Status:** 95-98% complete, production ready
