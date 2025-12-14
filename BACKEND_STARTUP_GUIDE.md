# Backend Startup Troubleshooting Guide

## Problem
The backend is hanging on startup because:
1. Redis connection is timing out (trying to connect to localhost:6379 which isn't running)
2. The original DATABASE_URL pointed to Prisma cloud which isn't accessible from this environment

## Solution

### Option 1: Use Mock Development Server (Quick Testing)

The mock server doesn't require Redis or PostgreSQL and is perfect for frontend testing:

```bash
cd /workspaces/profitbot/backend
npm run dev:mock
```

This will start a lightweight server on `http://localhost:3000` with:
- Login endpoint: POST `/auth/admin/login`
- Default credentials: `admin@example.com` / `admin123`
- Mock endpoints for dashboard, users, stats, etc.

**Login Test:**
```bash
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Option 2: Use Full Stack with Docker

If you want to run the complete backend with database:

```bash
# Start Docker services
cd /workspaces/profitbot
docker-compose up -d postgres redis

# Wait for services to start (about 10-15 seconds)
sleep 15

# Run migrations
cd backend
npx prisma migrate deploy

# Seed default admin user
npx prisma db seed

# Start backend
npm run dev
```

The backend will then be available at `http://localhost:3000`

### Option 3: Check Individual Services

If services are having issues, test them separately:

**Test PostgreSQL connection:**
```bash
psql postgresql://postgres:password@localhost:5432/tron_lock_db -c "SELECT 1;"
```

**Test Redis connection:**
```bash
redis-cli ping
# Should return: PONG
```

## Environment Configuration

The `.env.local` file has been updated to use local PostgreSQL:
- DATABASE_URL: `postgresql://postgres:password@localhost:5432/tron_lock_db`
- REDIS_URL: `redis://localhost:6379`

## Frontend Configuration

The frontend at `/workspaces/profitbot/frontend` is configured to:
- Connect to backend at `http://localhost:3000` (during development)
- Use default proxy settings in `next.config.js`

To run frontend:
```bash
cd /workspaces/profitbot/frontend
npm run dev
# Frontend will be at http://localhost:3001
```

## Testing the Login Flow

1. Start backend (mock or full)
2. Start frontend in another terminal
3. Navigate to `http://localhost:3001/login`
4. Enter credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
   - TOTP (if using full backend): Leave empty for development
5. Click Login

## Logs and Debugging

Check the dev server logs by looking at the terminal output where you ran:
- `npm run dev:mock` for mock server
- `npm run dev` for real server

If startup hangs:
1. It's usually a database/Redis connection timeout
2. Try the mock server first to verify frontend works
3. Then work on getting Docker services running for the full stack

## Files Modified

- `/workspaces/profitbot/backend/src/dev-server.ts` - New development server
- `/workspaces/profitbot/backend/src/index.ts` - Added Redis timeout handling
- `/workspaces/profitbot/backend/package.json` - Added `npm run dev:mock` script
- `/workspaces/profitbot/.env.local` - Updated DATABASE_URL to local PostgreSQL

## Next Steps

1. Try the mock server first: `cd backend && npm run dev:mock`
2. Test login in frontend
3. Once frontend works, set up Docker for the full backend
4. Run full integration tests

