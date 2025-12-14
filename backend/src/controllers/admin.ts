import express from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { tronService } from '../services/tron';
import config from '../config';

const router = express.Router();

// Get admin dashboard statistics
router.get('/dashboard', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDeposits,
    totalDepositedAmount,
    totalLots,
    totalPrincipalLocked,
    totalPayouts,
    totalPayoutAmount,
    totalReferrals,
    qualifiedReferrals,
    opsWalletBalance,
    pendingOverrideRequests,
    eligibleForPayout
  ] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.count(),
    prisma.deposit.aggregate({
      _sum: { amountMicro: true }
    }),
    prisma.lockLot.count(),
    prisma.lockLot.aggregate({
      _sum: { principalMicro: true }
    }),
    prisma.payout.count(),
    prisma.payout.aggregate({
      _sum: { amountMicro: true }
    }),
    prisma.referral.count(),
    prisma.referral.count({ where: { qualified: true } }),
    tronService.getTrxBalance(config.opsTrxWallet),
    prisma.overrideRequest.count({ where: { status: 'pending_approval' } }),
    prisma.lockLot.count({
      where: {
        status: 'ELIGIBLE',
        user: { payoutAddress: { not: null } },
        payouts: { none: {} }
      }
    })
  ]);

  // Get recent activity
  const recentDeposits = await prisma.deposit.findMany({
    take: 10,
    orderBy: { detectedAt: 'desc' },
    include: {
      user: true
    }
  });

  const recentPayouts = await prisma.payout.findMany({
    take: 10,
    orderBy: { paidAt: 'desc' },
    include: {
      user: true,
      lot: true
    }
  });

  res.json({
    stats: {
      totalUsers,
      totalDeposits: totalDeposits || 0,
      totalDepositedAmount: totalDepositedAmount._sum.amountMicro || 0,
      totalLots: totalLots || 0,
      totalPrincipalLocked: totalPrincipalLocked._sum.principalMicro || 0,
      totalPayouts: totalPayouts || 0,
      totalPayoutAmount: totalPayoutAmount._sum.amountMicro || 0,
      totalReferrals,
      qualifiedReferrals,
      opsWalletBalance,
      pendingOverrideRequests,
      eligibleForPayout
    },
    recentActivity: {
      deposits: recentDeposits,
      payouts: recentPayouts
    }
  });
}));

// Get system settings
router.get('/settings', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const settings = await prisma.config.findMany();
  
  res.json({
    environment: {
      nodeEnv: config.nodeEnv,
      network: config.network,
      usdtContractAddress: config.usdtContractAddress,
      adminColdWallet: config.adminColdWallet,
      adminFeeWallet: config.adminFeeWallet,
      opsTrxWallet: config.opsTrxWallet
    },
    blockchain: {
      requiredConfirmations: config.requiredConfirmations,
      minDepositUsdt: config.minDepositUsdt,
      fixedFeeUsdt: config.fixedFeeUsdt,
      lockDurationDays: config.lockDurationDays,
      rewardBps: config.rewardBps,
      requiredReferrals: config.requiredReferrals
    },
    opsWallet: {
      opsTrxMinBalance: config.opsTrxMinBalance,
      trxTopupAmount: config.trxTopupAmount
    },
    config: settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {})
  });
}));

// Update system setting (SUPER_ADMIN only)
router.put('/settings/:key', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const { userId } = req.user!;

  const setting = await prisma.config.upsert({
    where: { key },
    update: {
      value,
      updatedBy: userId
    },
    create: {
      key,
      value,
      updatedBy: userId
    }
  });

  logger.info(`Setting ${key} updated by SUPER_ADMIN ${userId}`, { value });

  res.json({ setting });
}));

// Get wallet balances (admin only)
router.get('/wallet-balances', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const [
    opsTrxBalance,
    coldWalletUsdtBalance,
    feeWalletUsdtBalance
  ] = await Promise.all([
    tronService.getTrxBalance(config.opsTrxWallet),
    tronService.getUsdtBalance(config.adminColdWallet),
    tronService.getUsdtBalance(config.adminFeeWallet)
  ]);

  res.json({
    opsWallet: {
      address: config.opsTrxWallet,
      trxBalance: opsTrxBalance,
      alertThreshold: config.opsTrxMinBalance,
      needsFunding: opsTrxBalance < config.opsTrxMinBalance
    },
    coldWallet: {
      address: config.adminColdWallet,
      usdtBalance: coldWalletUsdtBalance
    },
    feeWallet: {
      address: config.adminFeeWallet,
      usdtBalance: feeWalletUsdtBalance
    }
  });
}));

// Get system health (admin only)
router.get('/health', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    network: config.network,
    services: {
      database: 'unknown',
      redis: 'unknown',
      tron: 'unknown'
    }
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'error';
    logger.error('Database health check failed:', error);
  }

  try {
    // Check TRON network
    const currentBlock = await tronService.getCurrentBlock();
    health.services.tron = currentBlock > 0 ? 'healthy' : 'error';
  } catch (error) {
    health.services.tron = 'error';
    logger.error('TRON network health check failed:', error);
  }

  health.healthy = Object.values(health.services).every(status => status === 'healthy');

  res.json(health);
}));

// Export audit logs (admin only)
router.get('/audit/export', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { from, to, type } = req.query;

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  let data: any[] = [];
  let filename = '';

  switch (type) {
    case 'deposits':
      data = await prisma.deposit.findMany({
        where,
        include: { user: true }
      });
      filename = `deposits_${Date.now()}.csv`;
      break;
    case 'payouts':
      data = await prisma.payout.findMany({
        where,
        include: { user: true, lot: true }
      });
      filename = `payouts_${Date.now()}.csv`;
      break;
    case 'sweeps':
      data = await prisma.sweep.findMany({
        where,
        include: { deposit: { include: { user: true } } }
      });
      filename = `sweeps_${Date.now()}.csv`;
      break;
    case 'overrides':
      data = await prisma.overrideAudit.findMany({
        where,
        include: { lot: { include: { user: true } } }
      });
      filename = `overrides_${Date.now()}.csv`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid export type' });
  }

  // Convert to CSV (simplified implementation)
  if (data.length === 0) {
    return res.json({ csv: '', filename, count: 0 });
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = (row as any)[header];
      return typeof value === 'object' ? JSON.stringify(value) : value;
    }).join(',')
  );

  const csv = [csvHeaders, ...csvRows].join('\n');

  res.json({
    csv,
    filename,
    count: data.length
  });
}));

export default router;