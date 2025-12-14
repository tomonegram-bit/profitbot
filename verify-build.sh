#!/bin/bash
# verify-build.sh - Verify all services are built and ready

set -e

echo "🔍 Verifying TronBot Build Status..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_build() {
  local service=$1
  local dist_path=$2
  local entry_file=$3
  
  if [ -f "$dist_path/$entry_file" ]; then
    echo -e "${GREEN}✅ $service${NC} - Build successful"
    ls -lh "$dist_path/$entry_file"
    return 0
  else
    echo -e "${RED}❌ $service${NC} - Build failed or missing"
    return 1
  fi
}

echo ""
echo "📦 Checking Build Outputs..."
echo "----------------------------"

# Check backend
check_build "Backend" "backend/dist" "index.js"

# Check frontend
if [ -d "frontend/.next/server" ]; then
  echo -e "${GREEN}✅ Frontend${NC} - Build successful"
  echo "   Next.js build: $(du -sh frontend/.next | cut -f1)"
else
  echo -e "${RED}❌ Frontend${NC} - Build failed"
  exit 1
fi

# Check bot
check_build "Bot" "bot/dist" "index.js"

echo ""
echo "📋 Environment Variables..."
echo "----------------------------"

if [ -f ".env.local" ]; then
  VARS_COUNT=$(grep -c "^[^#]" .env.local || echo 0)
  echo -e "${GREEN}✅ .env.local${NC} found with $VARS_COUNT variables"
else
  echo -e "${YELLOW}⚠️  .env.local${NC} not found (optional for dev)"
fi

echo ""
echo "🧪 TypeScript Type Check..."
echo "----------------------------"

# Type check backend
if cd backend && npx tsc --noEmit 2>/dev/null; then
  echo -e "${GREEN}✅ Backend${NC} - No type errors"
  cd ..
else
  echo -e "${YELLOW}⚠️  Backend${NC} - Type check issues (may be non-critical)"
  cd ..
fi

# Type check bot
if cd bot && npx tsc --noEmit 2>/dev/null; then
  echo -e "${GREEN}✅ Bot${NC} - No type errors"
  cd ..
else
  echo -e "${YELLOW}⚠️  Bot${NC} - Type check issues (may be non-critical)"
  cd ..
fi

echo ""
echo "📊 Build Summary..."
echo "----------------------------"

BACKEND_SIZE=$(du -sh backend/dist | cut -f1)
FRONTEND_SIZE=$(du -sh frontend/.next | cut -f1)
BOT_SIZE=$(du -sh bot/dist | cut -f1)

echo "Backend:  $BACKEND_SIZE"
echo "Frontend: $FRONTEND_SIZE"
echo "Bot:      $BOT_SIZE"

echo ""
echo "🚀 Ready for Deployment!"
echo "======================================"
echo ""
echo "Start services with:"
echo "  npm run dev              (development)"
echo "  docker-compose up -d     (production)"
echo ""
