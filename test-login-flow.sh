#!/bin/bash

echo "🧪 Testing TronBot Login Flow"
echo "================================"
echo ""

echo "1️⃣  Testing Backend Direct Login..."
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Backend login failed!"
  echo "Response: $RESPONSE"
  exit 1
fi
echo "✅ Backend login successful"
echo "Token: ${TOKEN:0:50}..."
echo ""

echo "2️⃣  Testing Backend API Proxy Login..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Backend API login failed!"
  echo "Response: $RESPONSE"
  exit 1
fi
echo "✅ Backend API login successful"
echo "Token: ${TOKEN:0:50}..."
echo ""

echo "3️⃣  Testing Frontend Proxy Login..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Frontend proxy login failed!"
  echo "Response: $RESPONSE"
  exit 1
fi
echo "✅ Frontend proxy login successful"
echo "Token: ${TOKEN:0:50}..."
echo ""

echo "4️⃣  Testing Auth Profile with Token..."
PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/profile)
EMAIL=$(echo $PROFILE | grep -o '"email":"[^"]*' | cut -d'"' -f4)
if [ -z "$EMAIL" ]; then
  echo "❌ Profile fetch failed!"
  echo "Response: $PROFILE"
  exit 1
fi
echo "✅ Profile fetch successful"
echo "User: $EMAIL"
echo ""

echo "5️⃣  Testing Frontend Health..."
HEALTH=$(curl -s http://localhost:3001/api/health)
STATUS=$(echo $HEALTH | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ -z "$STATUS" ]; then
  echo "❌ Health check failed!"
  echo "Response: $HEALTH"
  exit 1
fi
echo "✅ Frontend health check successful"
echo ""

echo "✅ All tests passed!"
echo "================================"
echo ""
echo "Login is working correctly. If the browser shows login issues:"
echo "1. Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)"
echo "2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "3. Check browser console for errors: F12 → Console tab"
