import express from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { tronService } from '../services/tron';
import { z } from 'zod';
import config from '../config';

const router = express.Router();

// List deposits (admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status, 
    userId, 
    from, 
    to 
  } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (from || to) {
    where.detectedAt = {};
    if (from) where.detectedAt.gte = new Date(from as string);
    if (to) where.detectedAt.lte = new Date(to as string);
  }

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { detectedAt: 'desc' },
      include: {
        user: true,
        lockLot: {
          include: {
            payouts: true
          }
        }
      }
    }),
    prisma.deposit.count({ where })
  ]);

  res.json({
    deposits,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get deposit by ID (admin only)
router.get('/:depositId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { depositId } = req.params;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
    include: {
      user: true,
      lockLot: {
        include: {
          payouts: true,
          referrals: true
        }
      },
      sweep: true
    }
  });

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit not found' });
  }

  res.json({ deposit });
}));

// Rescan deposit (admin only)
router.post('/:depositId/rescan', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { depositId } = req.params;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId }
  });

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit not found' });
  }

  // Get transaction details from blockchain
  const tx = await tronService.getTransaction(deposit.txHash);
  const txInfo = await tronService.getTransactionInfo(deposit.txHash);

  // Update confirmations
  const currentBlock = await tronService.getCurrentBlock();
  const confirmations = txInfo.blockNumber ? currentBlock - txInfo.blockNumber : 0;

  const updatedDeposit = await prisma.deposit.update({
    where: { id: depositId },
    data: {
      confirmations,
      blockNumber: txInfo.blockNumber,
      status: confirmations >= config.requiredConfirmations ? 'confirmed' : 'confirming'
    }
  });

  logger.info(`Rescanned deposit ${depositId}, confirmations: ${confirmations}`);

  res.json({ deposit: updatedDeposit });
}));

// Manual reprocess deposit (admin only)
router.post('/:depositId/reprocess', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { depositId } = req.params;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
    include: {
      user: true,
      lockLot: true
    }
  });

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit not found' });
  }

  if (deposit.status !== 'confirmed') {
    return res.status(400).json({ error: 'Deposit must be confirmed to reprocess' });
  }

  if (deposit.lockLot) {
    return res.status(400).json({ error: 'Deposit already has a lock lot' });
  }

  // Create lock lot
  const principalMicro = deposit.amountMicro - config.fixedFeeMicro;
  const unlockAt = new Date(Date.now() + (config.lockDurationDays * 24 * 60 * 60 * 1000));

  const lockLot = await prisma.lockLot.create({
    data: {
      userId: deposit.userId,
      depositId: deposit.id,
      principalMicro,
      startAt: new Date(),
      unlockAt,
      status: 'LOCKED',
      targetMet: false,
      requiredReferrals: config.requiredReferrals,
      rewardBps: config.rewardBps
    }
  });

  logger.info(`Reprocessed deposit ${depositId}, created lock lot ${lockLot.id}`);

  res.json({ 
    deposit: await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { lockLot: true }
    })
  });
}));

// Get deposit statistics (admin only)
router.get('/stats/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const where: any = {};
  if (from || to) {
    where.detectedAt = {};
    if (from) where.detectedAt.gte = new Date(from as string);
    if (to) where.detectedAt.lte = new Date(to as string);
  }

  const [
    totalDeposits,
    depositsByStatus,
    totalAmount,
    avgDepositAmount,
    depositsToday,
    depositsThisWeek
  ] = await Promise.all([
    prisma.deposit.count({ where }),
    prisma.deposit.groupBy({
      by: ['status'],
      where,
      _count: true
    }),
    prisma.deposit.aggregate({
      where,
      _sum: { amountMicro: true }
    }),
    prisma.deposit.aggregate({
      where,
      _avg: { amountMicro: true }
    }),
    prisma.deposit.count({
      where: {
        ...where,
        detectedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.deposit.count({
      where: {
        ...where,
        detectedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  res.json({
    totalDeposits,
    depositsByStatus: depositsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>),
    totalAmount: totalAmount._sum.amountMicro || 0,
    avgDepositAmount: avgDepositAmount._avg.amountMicro || 0,
    depositsToday,
    depositsThisWeek
  });
}));

export default router;