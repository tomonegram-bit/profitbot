# 🔧 Login Troubleshooting Guide

## ✅ Verified Working

All backend endpoints are responding correctly:

```bash
# Backend Direct Login ✅
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Frontend Proxy Login ✅  
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Both return valid JWT tokens.

## 🔍 Debugging Login Issues

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect → Console tab)
2. Try to login
3. Look for `[AUTH]` prefixed messages showing the login flow

### Step 2: Check Network Requests
1. Open DevTools: **F12**
2. Go to **Network** tab
3. Try to login
4. Look for the `admin/login` request
5. Check response status and content

### Step 3: Clear Browser Cache
**Browser cache can cause login issues:**

**Chrome/Edge:**
- Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)
- Select "Cached images and files"
- Click "Clear data"

**Firefox:**
- Ctrl + Shift + Delete
- Check "Cache"
- Click "Clear Now"

**Safari:**
- Develop → Empty Caches
- OR: Cmd + Option + E

### Step 4: Hard Refresh
After clearing cache, do a hard refresh:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

## 📋 Common Issues and Fixes

### Issue: "Cannot POST /api/auth/admin/login"
**Cause:** Backend not running
**Fix:**
```bash
cd /workspaces/profitbot/backend
npm run dev:mock
# Should show: 🚀 Development server running on port 3000
```

### Issue: "Invalid credentials" on every login attempt
**Cause:** Credentials not matching
**Fix:** Use exact credentials:
- Email: `admin@example.com`
- Password: `admin123`
- TOTP: Leave empty (optional for development)

### Issue: "Unexpected token..." or JSON parse error
**Cause:** Backend returned HTML error instead of JSON
**Fix:**
1. Restart backend: `npm run dev:mock`
2. Check backend logs: `tail -f /tmp/backend.log`
3. Verify backend is responding: `curl http://localhost:3000/health`

### Issue: Frontend can't connect to backend
**Cause:** Next.js proxy not working or backend down
**Fix:**
```bash
# Test the proxy is working
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}

# If it fails, restart frontend
cd /workspaces/profitbot/frontend
npm run dev
```

### Issue: Token saved but page doesn't redirect to dashboard
**Cause:** Router.push() may not be working in development
**Fix:**
1. Check browser console for errors (F12 → Console)
2. Manually navigate to http://localhost:3001/dashboard
3. If it loads with user data, auth is working

## 🧪 Manual Testing Commands

### Test 1: Login via CLI
```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
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

### Test 2: Use Token to Access Profile
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile
```

Expected response:
```json
{
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

## 📊 Service Status Check

Run this command to verify all services:

```bash
echo "Backend:"
curl -s http://localhost:3000/health | jq .

echo -e "\nFrontend Health:"
curl -s http://localhost:3001/api/health | jq .

echo -e "\nFrontend Login:"
curl -s -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq .
```

## 🚀 Quick Reset

If everything is broken, do a full reset:

```bash
# Kill all Node processes
pkill -f "node\|npm"

# Start backend
cd /workspaces/profitbot/backend
npm run dev:mock &

# Start frontend
cd /workspaces/profitbot/frontend
npm run dev &

# Wait 5 seconds
sleep 5

# Test login
curl -s -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq .
```

## 📝 Console Output Expected

When successfully logging in through the browser, you should see in the console (F12):

```
[AUTH] Attempting login for: admin@example.com
[AUTH] Login response status: 200
[AUTH] Login response data: {token: "...", user: {...}}
[AUTH] Login successful, storing token
```

If you see errors like `[AUTH] Login error: ...`, note the exact error message and refer to the "Common Issues" section above.

## 🆘 Still Having Issues?

1. **Check logs:**
   ```bash
   tail -20 /tmp/backend.log
   ```

2. **Verify environment:**
   ```bash
   echo $JWT_SECRET
   echo $MASTER_ENCRYPTION_KEY
   ```

3. **Test endpoints directly:**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3001/api/health
   ```

4. **Check port availability:**
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

## 📞 Support

Key files for reference:
- Frontend login: [`frontend/app/login/page.tsx`](./frontend/app/login/page.tsx)
- Auth provider: [`frontend/lib/auth/AuthProvider.tsx`](./frontend/lib/auth/AuthProvider.tsx)
- Backend mock server: [`backend/src/standalone-server.js`](./backend/src/standalone-server.js)
- Frontend config: [`frontend/next.config.js`](./frontend/next.config.js)

