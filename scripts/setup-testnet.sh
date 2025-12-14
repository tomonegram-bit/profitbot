#!/bin/bash

# Setup script for Nile testnet testing

echo "🚀 Setting up TRON Lock System for Nile testnet testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    print_status "Created .env file from example"
else
    print_status ".env file already exists"
fi

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_status "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
    exit 1
fi

# Check if Redis is ready
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is ready"
else
    print_error "Redis is not ready"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm run setup

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

cd ..

print_status "Backend setup complete"

# Create logs directory
mkdir -p logs

# Display next steps
echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   - TELEGRAM_BOT_TOKEN (get from @BotFather)"
echo "   - TELEGRAM_BOT_USERNAME"
echo "   - TRONGRID_API_KEY (get from trongrid.io)"
echo "   - MASTER_ENCRYPTION_KEY (32 characters)"
echo "   - JWT_SECRET"
echo ""
echo "2. Get testnet TRX from faucets:"
echo "   - https://nileex.io/join/getJoinPage"
echo "   - https://www.trongrid.io/faucet"
echo ""
echo "3. Start the services:"
echo "   npm run dev"
echo ""
echo "4. Access admin dashboard:"
echo "   http://localhost:3001"
echo "   Default login: admin@example.com / admin123"
echo ""
echo "5. Deploy MockUSDT contract via admin dashboard"
echo "   (Testnet Tools section)"
echo ""

print_status "Setup script completed successfully!"