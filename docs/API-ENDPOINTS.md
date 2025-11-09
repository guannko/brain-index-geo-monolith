# API Endpoints Reference

## Base URL

```
Production: https://annoris-production.up.railway.app/api
```

## 🔍 Health & Status

### GET /health

Check service health and configuration.

**Request:**
```bash
curl https://annoris-production.up.railway.app/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T13:14:32.000Z",
  "service": "brain-index-geo-monolith",
  "version": "3.1.0-ultimate-pro",
  "features": "Ultimate GEO Analysis (7 criteria PRO + 3 criteria FREE)",
  "providers": {
    "pro": ["chatgpt", "deepseek", "mistral", "grok", "gemini"],
    "free": ["chatgpt-free", "deepseek", "mistral", "grok", "gemini"]
  },
  "promptVersions": {
    "pro": "3.1-ultimate-pro",
    "free": "1.0-free"
  }
}
```

## 🔐 Authentication

### POST /api/auth/register

Register a new user account.

**Request:**
```bash
curl -X POST https://annoris-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123"
  }'
```

**Response:**
```json
{
  "message": "Registration successful",
  "userId": "abc123"
}
```

**Errors:**
- 400: User already exists

---

### POST /api/auth/login

Authenticate and receive JWT token.

**Request:**
```bash
curl -X POST https://annoris-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "FREE"
  }
}
```

**Errors:**
- 401: Invalid email or password

## 👤 User Management

### GET /api/user/profile

Get current user profile (requires authentication).

**Request:**
```bash
curl https://annoris-production.up.railway.app/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "plan": "FREE",
  "createdAt": "2025-11-09T10:00:00.000Z"
}
```

**Errors:**
- 401: No token provided / Invalid token
- 404: User not found

---

### GET /api/user/analyses

Get user's analysis history (requires authentication).

**Request:**
```bash
curl https://annoris-production.up.railway.app/api/user/analyses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "analyses": [
    {
      "score": 75,
      "brandName": "Tesla",
      "tier": "free",
      "timestamp": "2025-11-09T13:15:00.000Z",
      "providers": [
        {"name": "chatgpt-free", "score": 19},
        {"name": "deepseek", "score": 85},
        {"name": "mistral", "score": 78},
        {"name": "grok", "score": 82},
        {"name": "gemini", "score": 76}
      ]
    }
  ],
  "total": 1
}
```

## 📊 Analysis

### POST /api/analyzer/analyze

Start a new brand analysis.

**Request (Anonymous):**
```bash
curl -X POST https://annoris-production.up.railway.app/api/analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Tesla",
    "tier": "free"
  }'
```

**Request (Authenticated):**
```bash
curl -X POST https://annoris-production.up.railway.app/api/analyzer/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "input": "Tesla"
  }'
```

**Response:**
```json
{
  "jobId": "unxjmj",
  "status": "accepted",
  "input": "Tesla",
  "tier": "free",
  "providers": ["chatgpt-free", "deepseek", "mistral", "grok", "gemini"],
  "type": "geo-free-v1.0"
}
```

**Parameters:**
- `input` (required): Brand name to analyze
- `tier` (optional): "free" or "pro" (defaults to user's plan)

**Notes:**
- Analysis runs asynchronously
- Use `jobId` to poll for results
- FREE tier: All 5 AI providers
- PRO tier: Ultimate GEO 7-criteria analysis

---

### GET /api/analyzer/results/:id

Get analysis results by job ID.

**Request:**
```bash
curl https://annoris-production.up.railway.app/api/analyzer/results/unxjmj
```

**Response (Processing):**
```json
{
  "jobId": "unxjmj",
  "status": "processing",
  "brandName": "Tesla",
  "userId": "anonymous",
  "tier": "free",
  "timestamp": "2025-11-09T13:15:00.000Z"
}
```

**Response (Completed):**
```json
{
  "jobId": "unxjmj",
  "status": "completed",
  "userId": "anonymous",
  "result": {
    "score": 19,
    "providers": [
      {"name": "chatgpt-free", "score": 19},
      {"name": "deepseek", "score": 19},
      {"name": "mistral", "score": 19},
      {"name": "grok", "score": 19},
      {"name": "gemini", "score": 19}
    ],
    "breakdown": "Analysis details...",
    "insights": "Key insights...",
    "confidence": "Medium",
    "tier": "free",
    "model": "multi-provider",
    "promptVersion": "1.0-free",
    "timestamp": "2025-11-09T13:15:30.000Z",
    "brandName": "Tesla"
  }
}
```

**Response (Failed):**
```json
{
  "jobId": "unxjmj",
  "status": "completed",
  "userId": "anonymous",
  "result": {
    "score": 5,
    "error": "Analysis failed",
    "brandName": "Tesla",
    "tier": "free",
    "timestamp": "2025-11-09T13:15:30.000Z"
  }
}
```

**Errors:**
- 404: Job not found

**Polling Strategy:**
- Poll every 2 seconds
- Max 30 attempts (60 seconds timeout)
- Check `status` field

---

### GET /api/analyzer/dashboard

Get user dashboard statistics (requires authentication).

**Request:**
```bash
curl https://annoris-production.up.railway.app/api/analyzer/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "totalAnalyses": 5,
  "averageScore": 67,
  "improvementRate": "+12%",
  "aiMentions": 20,
  "recentAnalyses": [
    {
      "score": 75,
      "brandName": "Tesla",
      "timestamp": "2025-11-09T13:15:00.000Z"
    }
  ]
}
```

## 🔄 Response Formats

### Success Response
```json
{
  "data": { ... },
  "status": "success"
}
```

### Error Response
```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 📝 Status Codes

- **200** - Success
- **400** - Bad Request (invalid input)
- **401** - Unauthorized (missing/invalid token)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

## 🔒 Rate Limiting

Currently no rate limiting implemented.

**Future plans:**
- FREE: 10 analyses/day
- PRO: Unlimited

## 🎯 Best Practices

1. **Always check job status** - analysis is async
2. **Handle 404 gracefully** - jobs may expire
3. **Store JWT securely** - use httpOnly cookies in production
4. **Implement exponential backoff** - for polling
5. **Log API errors** - for debugging

## 📊 Example Flow

```javascript
// 1. Start analysis
const { jobId } = await POST('/api/analyzer/analyze', {
  input: 'Tesla'
});

// 2. Poll for results
let result;
while (!result) {
  const response = await GET(`/api/analyzer/results/${jobId}`);
  if (response.status === 'completed') {
    result = response.result;
  } else {
    await sleep(2000); // Wait 2 seconds
  }
}

// 3. Display results
console.log(`Score: ${result.score}%`);
console.log(`Providers:`, result.providers);
```
