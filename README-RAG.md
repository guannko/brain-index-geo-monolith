# 🧠 Brain Index GEO - RAG Pipeline Implementation

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key

### 2. Installation

```bash
# Clone repo
git clone https://github.com/guannko/brain-index-geo-monolith.git
cd brain-index-geo-monolith

# Checkout RAG branch
git checkout feature/rag-pipeline-implementation

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configure Environment

Edit `.env`:
```bash
# Required
OPENAI_API_KEY=sk-proj-your-key-here
JWT_SECRET=your-secret

# RAG Infrastructure
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379

# Optional - PostgreSQL
DATABASE_URL=postgresql://postgres:geo2025@localhost:5432/brain_index
```

### 4. Start Infrastructure

```bash
# Start Qdrant, Redis, PostgreSQL
docker-compose up -d

# Check services
docker-compose ps
```

Expected output:
```
NAME                   STATUS
brain-geo-qdrant       Up
brain-geo-redis        Up  
brain-geo-postgres     Up (optional)
```

### 5. Run Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## 📦 What's Included

### ✅ RAG Pipeline Components

1. **Ingestion Service** (`src/modules/rag/ingestion.service.ts`)
   - HTML parsing & cleaning (Cheerio)
   - Text chunking (LangChain - 800 tokens, 100 overlap)
   - Embedding generation (OpenAI text-embedding-3-small)
   - Vector storage (Qdrant)
   - Redis caching for embeddings

2. **Retrieval Service** (`src/modules/rag/retrieval.service.ts`)
   - Semantic search via Qdrant
   - Similarity scoring (Cosine)
   - Filtering by content type, document ID
   - Result highlighting

3. **Context Assembly** (`src/modules/rag/context.service.ts`)
   - Deduplication
   - Token-aware assembly
   - Source references

### 🔧 Infrastructure

- **Qdrant** (Vector DB) - Port 6333
- **Redis** (Caching) - Port 6379  
- **PostgreSQL** (Metadata) - Port 5432 (optional)

### 📝 Configuration

- Environment validation (Zod)
- Pino logger with pretty print (dev)
- TypeScript strict mode

---

## 🧪 Testing RAG Pipeline

### Test 1: Ingest Document

```bash
curl -X POST http://localhost:3000/api/rag/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "url": "https://example.com",
    "content": "<html><body>AI and machine learning are transforming industries...</body></html>",
    "metadata": {
      "title": "AI Article",
      "contentType": "article"
    }
  }'
```

Expected response:
```json
{
  "documentId": "uuid-here",
  "chunksCreated": 3
}
```

### Test 2: Retrieve Context

```bash
curl -X POST http://localhost:3000/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "query": "machine learning applications",
    "topK": 5,
    "minSimilarity": 0.7
  }'
```

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│      Fastify API            │
│  (src/modules/rag/*.ts)     │
└──────┬──────────────────────┘
       │
       ├──────► Qdrant (Vectors)
       ├──────► Redis (Cache)
       └──────► PostgreSQL (Metadata, optional)
```

---

## 📊 Performance Targets

- Document ingestion: < 1s per 500 tokens
- Retrieval: < 500ms
- Context assembly: < 200ms
- Embedding cache hit rate: > 80%

---

## 🔍 Troubleshooting

### Qdrant not connecting
```bash
# Check if running
docker ps | grep qdrant

# Check logs
docker logs brain-geo-qdrant

# Restart
docker-compose restart qdrant
```

### Redis cache disabled
```bash
# Check Redis
docker logs brain-geo-redis

# Test connection
redis-cli ping
```

### npm install slow
```bash
# Clear cache
npm cache clean --force

# Install with verbose
npm install --verbose
```

---

## 📚 Next Steps

1. ✅ RAG Pipeline - DONE
2. ⏳ G-Eval (Groundedness Score)
3. ⏳ E-E-A-T Metrics
4. ⏳ Schema Validation

---

## 🤝 Contributing

Branch: `feature/rag-pipeline-implementation`

```bash
git checkout feature/rag-pipeline-implementation
git pull
# Make changes
git add .
git commit -m "feat: your change"
git push
```

---

**Built with 🔥 by Boris + Jean Claude (AI CTO)**
