import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Network Configuration
  network: process.env.TRON_NETWORK || 'nile',
  tronFullNode: process.env.TRON_FULLNODE || 'https://nile.trongrid.io',
  tronSolidityNode: process.env.TRON_SOLIDITYNODE || 'https://nile.trongrid.io',
  tronEventServer: process.env.TRON_EVENTSERVER || 'https://nile.trongrid.io',
  trongridApiKey: process.env.TRONGRID_API_KEY || '',

  // Contract Addresses
  usdtContractAddress: process.env.USDT_CONTRACT_ADDRESS || '',

  // Wallet Addresses
  adminColdWallet: process.env.ADMIN_COLD_WALLET || '',
  adminFeeWallet: process.env.ADMIN_FEE_WALLET || '',
  opsTrxWallet: process.env.OPS_TRX_WALLET || '',
  opsTrxWalletPrivateKeyEncrypted: process.env.OPS_TRX_WALLET_PRIVATE_KEY_ENCRYPTED || '',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tron_lock_db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Telegram Bot
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',

  // Security
  masterEncryptionKey: process.env.MASTER_ENCRYPTION_KEY || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  totpServiceName: process.env.TOTP_SERVICE_NAME || 'TRON Lock System',

  // Application Settings
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  adminPort: parseInt(process.env.ADMIN_PORT || '3001'),
  botPort: parseInt(process.env.BOT_PORT || '3002'),

  // Blockchain Settings
  requiredConfirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS || '20'),
  minDepositUsdt: parseInt(process.env.MIN_DEPOSIT_USDT || '101'),
  fixedFeeUsdt: parseInt(process.env.FIXED_FEE_USDT || '1'),
  lockDurationDays: parseInt(process.env.LOCK_DURATION_DAYS || '30'),
  rewardBps: parseInt(process.env.REWARD_BPS || '1500'),
  requiredReferrals: parseInt(process.env.REQUIRED_REFERRALS || '1'),

  // OPS Wallet Settings
  opsTrxMinBalance: parseInt(process.env.OPS_TRX_MIN_BALANCE || '1000'),
  trxTopupAmount: parseInt(process.env.TRX_TOPUP_AMOUNT || '15'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Constants
  usdtDecimals: 6,
  get microUnit(): number {
    return Math.pow(10, this.usdtDecimals);
  },
  get minDepositMicro(): number {
    return this.minDepositUsdt * this.microUnit;
  },
  get fixedFeeMicro(): number {
    return this.fixedFeeUsdt * this.microUnit;
  }
};

// Validation
if (!config.masterEncryptionKey || config.masterEncryptionKey.length !== 32) {
  throw new Error('MASTER_ENCRYPTION_KEY must be exactly 32 characters');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

if (!config.telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!config.usdtContractAddress) {
  throw new Error('USDT_CONTRACT_ADDRESS is required');
}

export default config;