# TronBot

A production-grade TRON-based USDT lock program with Telegram bot and admin dashboard.

## 🚀 Features

- **Telegram Bot**: Complete user interface for deposits, balance tracking, and referrals
- **Admin Dashboard**: Comprehensive web dashboard for system management
- **TRON Integration**: Full blockchain integration with TronWeb
- **Security**: Encrypted private keys, 2FA authentication, audit logging
- **Scalability**: Microservices architecture with Redis queue workers
- **Compliance**: Complete audit trail for all operations

## 📋 System Overview

### Core Components

1. **Backend API** (`/backend`) - Express.js REST API with PostgreSQL
2. **Telegram Bot** (`/bot`) - User-facing Telegram bot
3. **Admin Dashboard** (`/frontend`) - Next.js admin interface
4. **Workers** - Background job processing with BullMQ
5. **Blockchain Service** - TRON network integration

### Key Features

- **USDT TRC20 Deposits**: Automatic deposit detection and confirmation
- **30-Day Lock Program**: Funds locked with 15% reward
- **Referral System**: 1 referral required to unlock funds
- **Two-Leg Sweep**: Principal to cold wallet, fee to fee wallet
- **Manual Payouts**: Admin-controlled payout system
- **Override System**: Two-person approval for exceptional cases

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Telegram Bot   │    │  Admin Dashboard│    │   Blockchain    │
│  (Node.js)      │    │   (Next.js)     │    │    (TRON)       │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                       │                             │
         └───────────────────────┴─────────────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Backend API          │
                    │    (Express.js/TS)        │
                    └─────────────┬─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────┴────────┐    ┌──────────┴────────┐    ┌─────────┴────────┐
│   PostgreSQL   │    │      Redis        │    │     Workers      │
│   (Database)   │    │    (Queue/Jobs)   │    │  (Background)    │
└────────────────┘    └───────────────────┘    └──────────────────┘
```

## 🛠️ Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- TRON Grid API Key (get from [TronGrid](https://www.trongrid.io/dashboard))
- Telegram Bot Token (create with [BotFather](https://t.me/botfather))

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tron-lock-system
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Network Configuration
TRON_NETWORK=nile
TRON_FULLNODE=https://nile.trongrid.io
TRON_SOLIDITYNODE=https://nile.trongrid.io
TRON_EVENTSERVER=https://nile.trongrid.io
TRONGRID_API_KEY=your_trongrid_api_key_here

# Contract Addresses
USDT_CONTRACT_ADDRESS=TXYZ1234567890abcdef

# Wallet Addresses
ADMIN_COLD_WALLET=TXYZ1234567890abcdef
ADMIN_FEE_WALLET=TXYZ1234567890abcdef
OPS_TRX_WALLET=TXYZ1234567890abcdef

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tron_lock_db
REDIS_URL=redis://localhost:6379

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_bot_username

# Security
MASTER_ENCRYPTION_KEY=your_32_character_master_key_here
JWT_SECRET=your_jwt_secret_here
```

### 3. Install Dependencies

```bash
npm run setup
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
docker-compose up -d postgres redis
```

#### Using Local PostgreSQL

```bash
# Create database
createdb tron_lock_db

# Run Prisma migrations
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. Build and Start Services

#### Development Mode

```bash
# Start all services
npm run dev

# Or start individually:
npm run backend:dev
npm run frontend:dev
npm run bot:dev
```

#### Production Mode with Docker

```bash
# Build and start all services
docker-compose up --build

# Or start in detached mode
docker-compose up -d --build
```

## 🧪 Nile Testnet Setup

### 1. Get Testnet TRX

Get free TRX from Nile testnet faucets:
- [Nile Faucet #1](https://nileex.io/join/getJoinPage)
- [Nile Faucet #2](https://www.trongrid.io/faucet)

### 2. Deploy MockUSDT Contract

Use the admin dashboard testnet tools to deploy:

1. Access admin dashboard at `http://localhost:3001`
2. Navigate to "Testnet Tools" section
3. Click "Deploy MockUSDT"
4. Copy the contract address to your `.env`

### 3. Mint MockUSDT for Testing

1. In admin dashboard, go to "Testnet Tools"
2. Enter a test wallet address
3. Click "Mint MockUSDT"
4. Send MockUSDT to deposit addresses for testing

### 4. Fund OPS_TRX_WALLET

Send 1000+ TRX to your `OPS_TRX_WALLET` address for gas fees.

## 📱 Telegram Bot Commands

### User Commands

- `/start [ref_<code>]` - Register and get deposit address
- `/deposit` - Show deposit address
- `/balance` - Check balance and lots
- `/ref` - Get referral link and stats
- `/history` - View transaction history
- `/set_payout <address>` - Set payout address
- `/get_payout` - Show current payout address
- `/status` - Comprehensive status
- `/help` - Show help

### Admin Bot Commands (Coming Soon)

- `/admin_stats` - System statistics
- `/admin_users` - User management
- `/admin_payouts` - Payout management

## 🖥️ Admin Dashboard

Access the admin dashboard at `http://localhost:3001`

### Features

1. **Dashboard Overview** - System statistics and recent activity
2. **User Management** - Search, view, and manage users
3. **Deposits** - Monitor and manage deposits
4. **Sweeps** - Track sweep operations and failures
5. **Lots** - Manage lock lots and maturity
6. **Payouts** - Manual payout workflow
7. **Overrides** - Exceptional unlock requests
8. **Settings** - System configuration
9. **Testnet Tools** - Deploy contracts and mint tokens (Nile only)
10. **Audit & Compliance** - Export logs and reports

### Authentication

- Default login: `admin@example.com` / `admin123`
- Setup 2FA on first login
- Role-based access control (ADMIN, SUPER_ADMIN, AUDITOR)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TRON_NETWORK` | Network (nile/mainnet) | nile |
| `TRON_FULLNODE` | TRON full node URL | https://nile.trongrid.io |
| `USDT_CONTRACT_ADDRESS` | USDT contract address | |
| `ADMIN_COLD_WALLET` | Cold wallet for principal | |
| `ADMIN_FEE_WALLET` | Fee wallet | |
| `OPS_TRX_WALLET` | Operations wallet | |
| `DATABASE_URL` | PostgreSQL connection | |
| `REDIS_URL` | Redis connection | |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | |
| `MASTER_ENCRYPTION_KEY` | 32-char encryption key | |
| `JWT_SECRET` | JWT signing secret | |

### Application Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `REQUIRED_CONFIRMATIONS` | Deposit confirmations | 20 |
| `MIN_DEPOSIT_USDT` | Minimum deposit | 101 |
| `FIXED_FEE_USDT` | Fee per deposit | 1 |
| `LOCK_DURATION_DAYS` | Lock period | 30 |
| `REWARD_BPS` | Reward rate (15% = 1500) | 1500 |
| `REQUIRED_REFERRALS` | Referrals needed | 1 |
| `OPS_TRX_MIN_BALANCE` | Alert threshold | 1000 |
| `TRX_TOPUP_AMOUNT` | Auto topup amount | 15 |

## 🔍 Monitoring

### Health Checks

- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost:3001`
- PostgreSQL: Docker health checks
- Redis: Docker health checks
- TRON Network: Monitored via backend

### Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/bot-combined.log` - Bot logs

### Alerts

Monitor these conditions:
1. OPS_TRX_WALLET balance < 1000 TRX
2. Failed sweep operations
3. Pending override requests
4. System health check failures

## 🚨 Operations Guide

### Funding OPS_TRX_WALLET

When balance drops below threshold:

1. Check current balance in admin dashboard
2. Send TRX to `OPS_TRX_WALLET` address
3. Monitor for automatic topups

### Handling Failed Sweeps

1. Check sweep status in admin dashboard
2. If `NEEDS_FEE`, system will auto topup
3. If failed, check error logs
4. Manual intervention may be required

### Processing Payouts

1. Check "Eligible Lots" in admin dashboard
2. Export payout batch
3. Send funds manually from cold wallet
4. Mark payouts as paid with transaction hash
5. Verify transaction on blockchain

### Override Requests

1. ADMIN creates override request with reason
2. SUPER_ADMIN approves with 2FA
3. System applies changes and logs audit
4. User is notified via Telegram (optional)

## 🧪 Testing

### Unit Tests

```bash
cd backend && npm test
cd bot && npm test
```

### Integration Tests

```bash
# Test deposit flow
npm run test:deposit-flow

# Test referral system
npm run test:referral-system

# Test payout workflow
npm run test:payout-workflow
```

### Manual Testing Checklist

- [ ] User registration with /start
- [ ] Deposit detection and confirmation
- [ ] Sweep execution (cold + fee legs)
- [ ] Referral qualification
- [ ] Lot maturity to ELIGIBLE
- [ ] Payout export and marking paid
- [ ] Admin override workflow
- [ ] 2FA authentication
- [ ] Error handling and recovery

## 🚀 Deployment

### Production Deployment

1. Update `.env` for mainnet:
   ```env
   TRON_NETWORK=mainnet
   TRON_FULLNODE=https://api.trongrid.io
   USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
   ```

2. Set up production infrastructure:
   - PostgreSQL with backups
   - Redis with persistence
   - Load balancer
   - SSL certificates

3. Deploy with Docker:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Network Switching

To switch from testnet to mainnet:

1. Update environment variables in `.env`
2. Restart all services
3. No code changes required!

## 📊 Database Schema

### Key Tables

- `User` - Telegram users and their deposit addresses
- `Deposit` - USDT deposits and confirmation status
- `LockLot` - Locked funds with maturity tracking
- `Referral` - Referral relationships and qualification
- `Sweep` - Sweep operations (cold + fee legs)
- `Payout` - Manual payout records
- `AdminUser` - Admin users with roles and 2FA
- `OverrideRequest` - Exceptional unlock requests
- `OverrideAudit` - Immutable audit trail

## 🔐 Security

### Private Key Management

- Private keys encrypted with AES-256-GCM
- Master encryption key from environment
- No private keys stored in plain text
- Envelope encryption pattern

### Authentication

- JWT tokens for API authentication
- TOTP-based 2FA for admins
- Role-based access control
- Session management

### Audit Logging

- All sensitive actions logged
- Override requests require approval
- Immutable audit records
- Exportable compliance reports

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check logs for error details

## 🔄 Updates

To update the system:

1. Pull latest changes
2. Update dependencies
3. Run database migrations
4. Restart services
5. Monitor for issues

---

**⚠️ Disclaimer**: This system handles real funds. Ensure proper testing on testnet before mainnet deployment. Always backup your data and private keys.