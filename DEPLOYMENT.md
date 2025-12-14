# Deployment Guide - TRON Lock System

## ✅ Build Status

**Last Build: December 14, 2025**

| Service | Status | Build Output | Run Command |
|---------|--------|--------------|-------------|
| **Backend** | ✅ SUCCESS | `backend/dist/` | `node dist/index.js` |
| **Frontend** | ✅ SUCCESS | `frontend/.next/` | `next start -p 3001` |
| **Bot** | ✅ SUCCESS | `bot/dist/` | `node dist/index.js` |

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+ (via Docker or local)
- **Redis** 7+ (via Docker or local)
- **Environment Variables** configured in `.env` or `.env.local`

---

## 🚀 Quick Start (Development)

### 1. Copy Environment
```bash
cp .env.example .env.local
# Edit .env.local with your configuration:
# - DATABASE_URL (Prisma connection)
# - TELEGRAM_BOT_TOKEN
# - TRONGRID_API_KEY
# - JWT_SECRET
# - MASTER_ENCRYPTION_KEY
```

### 2. Start Services (Concurrent)
```bash
npm run dev
```

This starts:
- **Backend API** on `http://localhost:3000`
- **Frontend Dashboard** on `http://localhost:3001`
- **Telegram Bot** (background)

### 3. Verify Services
```bash
# Check backend health
curl http://localhost:3000/health

# Open frontend
open http://localhost:3001/login

# Default login (after seed):
# Email: admin@example.com
# Password: admin123
```

---

## 🐳 Docker Deployment (Production)

### 1. Build Docker Images
```bash
docker-compose build
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Initialize Database
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### 4. Access Services
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 5. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f bot
```

---

## 📦 Build Commands

### Build All Services
```bash
npm run build
```

### Build Individually
```bash
# Backend (Express.js + TypeScript)
npm run backend:build

# Frontend (Next.js)
npm run frontend:build

# Bot (Node.js + TypeScript)
npm run bot:build
```

### Build Output
- **Backend**: `backend/dist/` (CommonJS)
- **Frontend**: `frontend/.next/` (Next.js production)
- **Bot**: `bot/dist/` (CommonJS)

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
# or individually:
npm run backend:test
npm run frontend:test
npm run bot:test
```

### Integration Tests
```bash
npm run test:deposit-flow        # Test deposit detection
npm run test:referral-system     # Test referral logic
npm run test:payout-workflow     # Test payout processing
```

---

## 🔍 Health Checks

### Backend Health
```bash
curl -X GET http://localhost:3000/admin/health \
  -H "Authorization: Bearer <jwt_token>"
```

Response:
```json
{
  "timestamp": "2025-12-14T11:00:00Z",
  "uptime": 3600,
  "memory": { "rss": "150MB", "heapUsed": "75MB" },
  "environment": "development",
  "network": "nile",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "tron": "healthy"
  },
  "healthy": true
}
```

### Frontend Health
```bash
curl -X GET http://localhost:3001/api/health
```

### Bot Health
Check Telegram by sending `/status` command to the bot.

---

## 🔐 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# API Keys
TRONGRID_API_KEY=your_api_key
TELEGRAM_BOT_TOKEN=bot_token

# Secrets
JWT_SECRET=random_32_char_string
MASTER_ENCRYPTION_KEY=random_32_char_string
COORDINATOR_JWT_SECRET_KEY=jwt_token

# TRON Network
TRON_NETWORK=nile  # or mainnet
USDT_CONTRACT_ADDRESS=contract_address

# Wallets
ADMIN_COLD_WALLET=address
ADMIN_FEE_WALLET=address
OPS_TRX_WALLET=address
```

### Optional Variables (with defaults)
```env
NODE_ENV=development
PORT=3000
ADMIN_PORT=3001
BOT_PORT=3002
LOG_LEVEL=info
REQUIRED_CONFIRMATIONS=20
MIN_DEPOSIT_USDT=101
LOCK_DURATION_DAYS=30
REWARD_BPS=1500
```

---

## 📊 Database Setup

### Using Docker PostgreSQL
```bash
docker-compose up -d postgres redis
```

### Using Local PostgreSQL
```bash
createdb tron_lock_db

# Apply migrations
cd backend
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

### Database Schema
Run Prisma Studio to browse schema:
```bash
cd backend
npx prisma studio
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running:
psql -U postgres -d tron_lock_db
```

### Redis Connection Failed
```bash
# Verify Redis is running:
redis-cli ping
# Response: PONG
```

### Telegram Bot Not Responding
```bash
# Verify token:
curl -X GET "https://api.telegram.org/bot<TOKEN>/getMe"

# Check logs:
docker-compose logs -f bot
```

---

## 📈 Performance Monitoring

### Resource Usage
```bash
docker stats
```

### Database Queries
```bash
cd backend
npx prisma db execute --stdin < query.sql
```

### Application Logs
```bash
# Backend logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# Bot logs
tail -f logs/bot-combined.log
```

---

## 🔄 Deployment Checklist

- [ ] All environment variables set in `.env`
- [ ] Database running and migrations applied
- [ ] Redis running
- [ ] Backend builds without errors: `npm run backend:build`
- [ ] Frontend builds without errors: `npm run frontend:build`
- [ ] Bot builds without errors: `npm run bot:build`
- [ ] Backend health check passing
- [ ] Admin user created via seed or manually
- [ ] Telegram bot token verified
- [ ] TRON network connection verified
- [ ] Wallets configured with sufficient balance

---

## 🚀 Production Deployment Steps

### 1. Prepare Production Environment
```bash
# Create production .env file
cp .env.example .env.production

# Update with production credentials
nano .env.production
```

### 2. Build Production Images
```bash
docker-compose -f docker-compose.yml build --no-cache
```

### 3. Deploy to Production
```bash
# Start in detached mode
docker-compose up -d

# Verify all services running
docker-compose ps
```

### 4. Monitor Deployment
```bash
# Follow logs
docker-compose logs -f

# Check health endpoints
curl http://localhost:3000/admin/health
```

### 5. Verify Data
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d tron_lock_db

# Check admin user
SELECT * FROM "AdminUser" LIMIT 1;
```

---

## 📝 Configuration Examples

### For Nile Testnet
```env
TRON_NETWORK=nile
TRON_FULLNODE=https://nile.trongrid.io
TRON_SOLIDITYNODE=https://nile.trongrid.io
TRON_EVENTSERVER=https://nile.trongrid.io
```

### For TRON Mainnet
```env
TRON_NETWORK=mainnet
TRON_FULLNODE=https://api.trongrid.io
TRON_SOLIDITYNODE=https://api.trongrid.io
TRON_EVENTSERVER=https://api.trongrid.io
USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

---

## 📞 Support & Logs

All logs are written to:
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/bot-combined.log` - Bot-specific logs

Monitor in real-time:
```bash
tail -f logs/combined.log
```

---

**Last Updated**: December 14, 2025  
**Status**: ✅ All services built and ready for deployment
