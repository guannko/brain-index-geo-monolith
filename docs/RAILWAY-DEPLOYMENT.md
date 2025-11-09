# Railway Deployment Guide

## 🚂 Railway Infrastructure

### Projects & Services

**Project:** Brain Index Production
- **Service 1:** bubbly-elegance (Backend)
  - Repo: brain-index-geo-monolith
  - Branch: main
  - Region: Europe
  
- **Service 2:** qdrant-ma8b (Vector DB)
  - Image: qdrant/qdrant:latest
  - Volume: qdrant-ma8b-volume
  - Port: 6333 (gRPC), 6334 (HTTP)

### Network Configuration

**Private Networking:**
- Enabled between services
- Internal domain: `qdrant-ma8b.railway.internal:6333`
- No external SSL needed for internal communication

**Public Domains:**
- Backend: `annoris-production.up.railway.app`
- Qdrant: `qdrant-ma8b-production.up.railway.app` (dashboard)

## 🔧 Backend Configuration

### Environment Variables

```bash
# Server
PORT=3000

# AI Provider Keys
OPENAI_API_KEY=sk-proj-...
DEEPSEEK_API_KEY=sk-...
MISTRAL_API_KEY=...
GROK_API_KEY=xai-...
GEMINI_API_KEY=AIza...

# Database
QDRANT_URL=http://qdrant-ma8b.railway.internal:6333

# Auth (optional)
JWT_SECRET=brain-index-secret-2025

# Providers (optional, defaults to all)
PROVIDERS=chatgpt,deepseek,mistral,grok,gemini
```

### Build Settings

**Start Command:**
```bash
npm run start
```

**Build Command:**
```bash
npm install && npm run build
```

**Install Command:**
```bash
npm install
```

### package.json Scripts
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

## 🗄️ Qdrant Configuration

### Docker Image
- Image: `qdrant/qdrant:latest`
- Version: 1.15.5

### Ports
- **6333** - HTTP API (internal)
- **6334** - gRPC API (internal)

### Volume
- Mount path: `/qdrant/storage`
- Volume: `qdrant-ma8b-volume`
- Size: Railway auto-manages

### Collections
- `brain-index-documents` - Main collection for RAG
- Vector size: 1536 (OpenAI embeddings)

## 🚀 Deployment Flow

### Automatic Deployment

1. **Push to GitHub** → main branch
2. **Railway detects** → new commit
3. **Build starts** → npm install + build
4. **Deploy** → new container with zero-downtime
5. **Health check** → `/health` endpoint
6. **Live** → new version active

### Manual Deployment

Via Railway Dashboard:
1. Go to service → Deployments
2. Click "Redeploy"
3. Select deployment to redeploy

Via Railway CLI:
```bash
railway up
```

## 📊 Monitoring

### Logs

**View logs:**
```bash
railway logs
```

**Real-time logs:**
```bash
railway logs --follow
```

**Filter logs:**
```bash
railway logs | grep "ERROR"
```

### Health Checks

**Backend:**
```bash
curl https://annoris-production.up.railway.app/health
```

**Qdrant:**
```bash
curl http://qdrant-ma8b.railway.internal:6333/collections
```

### Key Log Messages

**Startup Success:**
```
✅ Initialized 5 PRO providers: chatgpt, deepseek, mistral, grok, gemini
✅ Initialized 5 FREE providers: chatgpt-free, deepseek, mistral, grok, gemini
✅ RAG Pipeline initialized with Qdrant
🚀 Brain Index GEO v3.1 ULTIMATE
Server listening at http://0.0.0.0:3000
```

**Analysis Running:**
```
🎯 Starting FREE analysis with 5 provider(s)
✅ 5/5 providers succeeded
✅ FREE GEO analysis completed for [brand]
```

## 🐛 Troubleshooting

### Qdrant Connection Issues

**Symptom:**
```
❌ Qdrant initialization failed: Connect Timeout Error
⚠️ RAG Pipeline will be disabled for this session
```

**Fix:**
1. Check `QDRANT_URL` uses internal domain
2. Verify private networking enabled
3. Restart both services
4. Check Qdrant service is running

**Correct URL:**
```bash
QDRANT_URL=http://qdrant-ma8b.railway.internal:6333
```

**Wrong URL:**
```bash
QDRANT_URL=https://qdrant-ma8b-production.up.railway.app:443
```

### Build Failures

**Symptom:** Build fails with TypeScript errors

**Fix:**
1. Check `tsconfig.json` is correct
2. Verify all dependencies in `package.json`
3. Clear Railway cache (redeploy)

### Out of Memory

**Symptom:** Service crashes with OOM error

**Fix:**
1. Upgrade Railway plan
2. Optimize provider concurrency
3. Add memory limit handling

## 🔐 Security Best Practices

1. **Never commit API keys** - use Railway env vars
2. **Use private networking** - for internal services
3. **Enable CORS properly** - limit origins in production
4. **Rotate secrets regularly** - JWT_SECRET, API keys
5. **Monitor logs** - check for suspicious activity

## 💰 Cost Management

### Current Usage
- Backend: ~$5-10/month (hobby tier)
- Qdrant: ~$5/month (volume storage)
- **Total: ~$10-15/month**

### Optimization Tips
1. Use Railway sleep mode for staging
2. Clean up unused deployments
3. Monitor resource usage dashboard
4. Scale down during low traffic

## 🔄 Rollback Procedure

### Via Dashboard
1. Go to Deployments tab
2. Find previous working deployment
3. Click "Redeploy"

### Via CLI
```bash
railway rollback [deployment-id]
```

## 📝 Deployment Checklist

Before deploying major changes:
- [ ] Test locally with `npm run dev`
- [ ] Check all env vars are set
- [ ] Verify API keys are valid
- [ ] Test Qdrant connection
- [ ] Check logs for errors
- [ ] Monitor first 5 minutes after deploy
- [ ] Test `/health` endpoint
- [ ] Run analysis test (Tesla)

## 🎯 Production URLs

- **Backend API:** https://annoris-production.up.railway.app/api
- **Health Check:** https://annoris-production.up.railway.app/health
- **Qdrant Dashboard:** https://qdrant-ma8b-production.up.railway.app/dashboard
- **Frontend:** https://brain-index.com (Vercel)

## 📞 Support

**Railway Status:** https://railway.app/status
**Railway Docs:** https://docs.railway.app
**Railway Discord:** https://discord.gg/railway
