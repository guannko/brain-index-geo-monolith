# Brain Index GEO Platform

Multi-provider AI visibility analysis with RAG context.

## Features
- 🤖 Multi-Provider Analysis (OpenAI, DeepSeek, Mistral, Groq, Gemini)
- 📚 RAG Pipeline with Qdrant
- 🎯 Brand + Website combined analysis
- 📊 Variance detection across providers
- 🔐 JWT Authentication

## API Endpoints
- POST `/api/analyzer/analyze` - Start analysis
- GET `/api/analyzer/results/:id` - Get results
- GET `/health` - Health check

## Deploy: Railway + Vercel
Backend: Railway (this repo)
Frontend: Vercel (brain-index.com)

Last update: Multi-provider parallel analysis - Nov 7, 2025
