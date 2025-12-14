import express from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { tronService } from '../services/tron';

const router = express.Router();

// List payouts (admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status, 
    userId, 
    lotId,
    from, 
    to 
  } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (lotId) where.lotId = lotId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        lot: true,
        approvedBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.payout.count({ where })
  ]);

  res.json({
    payouts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get payout by ID (admin only)
router.get('/:payoutId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { payoutId } = req.params;

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      user: true,
      lot: true,
      approvedBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!payout) {
    return res.status(404).json({ error: 'Payout not found' });
  }

  res.json({ payout });
}));

// Mark payout as paid (admin only)
router.post('/:payoutId/mark-paid', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { payoutId } = req.params;
  const { txHash } = req.body;
  const { userId } = req.user!;

  if (!txHash) {
    return res.status(400).json({ error: 'txHash is required' });
  }

  // Validate transaction hash format
  if (!/^([a-fA-F0-9]{64})$/.test(txHash)) {
    return res.status(400).json({ error: 'Invalid transaction hash format' });
  }

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      lot: true,
      user: true
    }
  });

  if (!payout) {
    return res.status(404).json({ error: 'Payout not found' });
  }

  if (payout.status !== 'approved') {
    return res.status(400).json({ error: 'Payout must be approved before marking as paid' });
  }

  // Optional: Verify transaction on blockchain
  let txVerified = false;
  try {
    const tx = await tronService.getTransaction(txHash);
    if (tx) {
      // Check if transaction is for the correct amount and address
      // This is a simplified check - in production, verify all details
      txVerified = true;
    }
  } catch (error) {
    logger.warn(`Could not verify transaction ${txHash}:`, error);
  }

  const updatedPayout = await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: 'paid',
      txHash,
      paidAt: new Date()
    }
  });

  // Update lot status to PAID
  await prisma.lockLot.update({
    where: { id: payout.lotId },
    data: { status: 'PAID' }
  });

  logger.info(`Payout ${payoutId} marked as paid by admin ${userId}`, {
    txHash,
    amount: payout.amountMicro,
    userId: payout.userId,
    lotId: payout.lotId,
    txVerified
  });

  res.json({
    payout: updatedPayout,
    txVerified
  });
}));

// Create payout (admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { lotId } = req.body;
  const { userId } = req.user!;

  if (!lotId) {
    return res.status(400).json({ error: 'lotId is required' });
  }

  // Check if lot exists and is eligible
  const lot = await prisma.lockLot.findUnique({
    where: { id: lotId },
    include: {
      user: true,
      payouts: true
    }
  });

  if (!lot) {
    return res.status(404).json({ error: 'Lot not found' });
  }

  if (lot.status !== 'ELIGIBLE') {
    return res.status(400).json({ error: 'Lot must be ELIGIBLE to create payout' });
  }

  if (!lot.user.payoutAddress) {
    return res.status(400).json({ error: 'User must have payout address set' });
  }

  if (lot.payouts.some(p => p.status !== 'failed')) {
    return res.status(400).json({ error: 'Lot already has a pending or completed payout' });
  }

  // Calculate payout amounts
  const principalMicro = BigInt(lot.principalMicro);
  const rewardMicro = principalMicro * BigInt(lot.rewardBps) / BigInt(10000);
  const totalPayoutMicro = principalMicro + rewardMicro;

  const payout = await prisma.payout.create({
    data: {
      lotId: lot.id,
      userId: lot.userId,
      amountMicro: totalPayoutMicro,
      principalMicro: principalMicro,
      rewardMicro: rewardMicro,
      toAddress: lot.user.payoutAddress,
      status: 'queued'
    },
    include: {
      user: true,
      lot: true
    }
  });

  logger.info(`Payout created for lot ${lotId} by admin ${userId}`, {
    payoutId: payout.id,
    amount: totalPayoutMicro.toString(),
    userId: lot.userId
  });

  res.json({ payout });
}));

// Approve payout (admin only)
router.post('/:payoutId/approve', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { payoutId } = req.params;
  const { userId } = req.user!;

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: 'approved',
      approvedByAdminId: userId,
      approvedAt: new Date()
    },
    include: {
      user: true,
      lot: true
    }
  });

  logger.info(`Payout ${payoutId} approved by admin ${userId}`, {
    amount: payout.amountMicro,
    userId: payout.userId,
    lotId: payout.lotId
  });

  res.json({ payout });
}));

// Get payout statistics (admin only)
router.get('/stats/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const [
    totalPayouts,
    payoutsByStatus,
    totalAmount,
    avgPayoutAmount,
    payoutsToday,
    payoutsThisWeek
  ] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.groupBy({
      by: ['status'],
      where,
      _count: true
    }),
    prisma.payout.aggregate({
      where,
      _sum: { amountMicro: true }
    }),
    prisma.payout.aggregate({
      where,
      _avg: { amountMicro: true }
    }),
    prisma.payout.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.payout.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  res.json({
    totalPayouts,
    payoutsByStatus: payoutsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>),
    totalAmount: totalAmount._sum.amountMicro || 0,
    avgPayoutAmount: avgPayoutAmount._avg.amountMicro || 0,
    payoutsToday,
    payoutsThisWeek
  });
}));

export default router;