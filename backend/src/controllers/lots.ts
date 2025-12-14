import express from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// List lots (admin only)
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
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const [lots, total] = await Promise.all([
    prisma.lockLot.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        deposit: true,
        payouts: true,
        referrals: true
      }
    }),
    prisma.lockLot.count({ where })
  ]);

  res.json({
    lots,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get lot by ID (admin only)
router.get('/:lotId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { lotId } = req.params;

  const lot = await prisma.lockLot.findUnique({
    where: { id: lotId },
    include: {
      user: true,
      deposit: true,
      payouts: true,
      referrals: true
    }
  });

  if (!lot) {
    return res.status(404).json({ error: 'Lot not found' });
  }

  res.json({ lot });
}));

// Get eligible lots for payout (admin only)
router.get('/payouts/eligible', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    status: 'ELIGIBLE',
    user: {
      payoutAddress: { not: null }
    }
  };

  const [lots, total] = await Promise.all([
    prisma.lockLot.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { unlockAt: 'asc' },
      include: {
        user: true,
        deposit: true,
        payouts: {
          where: { status: { not: 'paid' } }
        }
      }
    }),
    prisma.lockLot.count({ where })
  ]);

  // Filter out lots that already have pending payouts
  const eligibleLots = lots.filter(lot => lot.payouts.length === 0);

  res.json({
    lots: eligibleLots,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: eligibleLots.length,
      pages: Math.ceil(eligibleLots.length / Number(limit))
    }
  });
}));

// Export eligible lots for payout (admin only)
router.post('/payouts/export', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { lotIds } = req.body;

  if (!lotIds || !Array.isArray(lotIds)) {
    return res.status(400).json({ error: 'lotIds array is required' });
  }

  const lots = await prisma.lockLot.findMany({
    where: {
      id: { in: lotIds },
      status: 'ELIGIBLE',
      user: {
        payoutAddress: { not: null }
      }
    },
    include: {
      user: true,
      payouts: {
        where: { status: { not: 'paid' } }
      }
    }
  });

  // Filter out lots that already have pending payouts
  const exportableLots = lots.filter(lot => lot.payouts.length === 0);

  const payoutData = exportableLots.map(lot => {
    const principalMicro = BigInt(lot.principalMicro);
    const rewardMicro = principalMicro * BigInt(lot.rewardBps) / BigInt(10000);
    const totalPayoutMicro = principalMicro + rewardMicro;

    return {
      lotId: lot.id,
      telegramUserId: lot.user.telegramUserId,
      payoutAddress: lot.user.payoutAddress,
      amountMicro: totalPayoutMicro.toString(),
      principalMicro: principalMicro.toString(),
      rewardMicro: rewardMicro.toString()
    };
  });

  res.json({
    export: payoutData,
    totalAmount: payoutData.reduce((sum, item) => sum + BigInt(item.amountMicro), BigInt(0)).toString(),
    count: payoutData.length
  });
}));

// Get lot statistics (admin only)
router.get('/stats/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const [
    totalLots,
    lotsByStatus,
    totalPrincipal,
    maturedLots,
    eligibleLots,
    maturedLockedLots
  ] = await Promise.all([
    prisma.lockLot.count({ where }),
    prisma.lockLot.groupBy({
      by: ['status'],
      where,
      _count: true
    }),
    prisma.lockLot.aggregate({
      where,
      _sum: { principalMicro: true }
    }),
    prisma.lockLot.count({
      where: {
        ...where,
        status: 'ELIGIBLE'
      }
    }),
    prisma.lockLot.count({
      where: {
        ...where,
        status: 'ELIGIBLE'
      }
    }),
    prisma.lockLot.count({
      where: {
        ...where,
        status: 'MATURED_LOCKED'
      }
    })
  ]);

  // Calculate projected rewards
  const projectedRewards = totalPrincipal._sum.principalMicro || 0;
  const totalRewards = projectedRewards * 0.15;

  res.json({
    totalLots,
    lotsByStatus: lotsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>),
    totalPrincipal: totalPrincipal._sum.principalMicro || 0,
    totalRewards: Math.floor(totalRewards),
    maturedLots,
    eligibleLots,
    maturedLockedLots
  });
}));

export default router;