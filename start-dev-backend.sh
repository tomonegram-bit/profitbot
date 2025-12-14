#!/bin/bash
# Development server startup script
# This bypasses Redis/Prisma for quick testing

cd "$(dirname "$0")"
cd backend

echo "Starting development backend server (no Redis/Prisma)..."
npx ts-node src/dev-server.ts
