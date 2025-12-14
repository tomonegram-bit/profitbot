import express from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { tronService } from '../services/tron';
import { encrypt } from '../utils/encryption';
import { z } from 'zod';

const router = express.Router();

// Get user by telegram ID (admin only)
router.get('/telegram/:telegramUserId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req: AuthRequest, res) => {
  const { telegramUserId } = req.params;

  const user = await prisma.user.findUnique({
    where: { telegramUserId },
    include: {
      deposits: {
        include: {
          lockLot: true
        }
      },
      lockLots: {
        include: {
          deposit: true,
          payouts: true
        }
      },
      referrals: {
        include: {
          referred: true,
          qualifiedDeposit: true,
          qualifiesForLot: true
        }
      },
      referredBy: true
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// List all users (admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search ? {
    OR: [
      { telegramUserId: { contains: search as string } },
      { username: { contains: search as string } },
      { depositAddress: { contains: search as string } },
      { referralCode: { contains: search as string } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            deposits: true,
            lockLots: true,
            referrals: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get referral tree (admin only)
router.get('/referrals/tree', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.query;

  const buildReferralTree = async (userId: string, depth = 0, maxDepth = 5): Promise<any> => {
    if (depth > maxDepth) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            referred: true,
            qualifiedDeposit: true,
            qualifiesForLot: true
          }
        }
      }
    });

    if (!user) return null;

    const referrals = await Promise.all(
      user.referrals.map(async (referral) => {
        const referredUser = await buildReferralTree(referral.referredUserId, depth + 1, maxDepth);
        return {
          ...referral,
          referred: referredUser
        };
      })
    );

    return {
      id: user.id,
      telegramUserId: user.telegramUserId,
      username: user.username,
      depositAddress: user.depositAddress,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      referrals
    };
  };

  let rootUsers;
  if (userId) {
    rootUsers = [await prisma.user.findUnique({ where: { id: userId as string } })];
  } else {
    rootUsers = await prisma.user.findMany({
      where: { referredByUserId: null },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  const trees = await Promise.all(
    rootUsers
      .filter(Boolean)
      .map(user => buildReferralTree(user!.id))
  );

  res.json({ trees });
}));

// Generate new deposit address for user (admin only)
router.post('/:userId/generate-address', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.depositAddress) {
    return res.status(400).json({ error: 'User already has a deposit address' });
  }

  // Generate new TRON account
  const account = tronService.generateAccount();
  
  // Encrypt private key
  const encryptedPrivateKey = encrypt(account.privateKey);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      depositAddress: account.address,
      depositAddressKeyRef: encryptedPrivateKey
    }
  });

  logger.info(`Generated deposit address for user ${userId}: ${account.address}`);

  res.json({
    user: updatedUser,
    depositAddress: account.address
  });
}));

// Update payout address (admin only)
router.put('/:userId/payout-address', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { payoutAddress } = req.body;

  // Validate TRON address
  if (!tronService.validateAddress(payoutAddress)) {
    return res.status(400).json({ error: 'Invalid TRON address' });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      payoutAddress,
      payoutAddressUpdatedAt: new Date()
    }
  });

  logger.info(`Updated payout address for user ${userId}: ${payoutAddress}`);

  res.json({ user });
}));

// Get user statistics (admin only)
router.get('/stats/overview', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalUsers,
    totalDeposits,
    totalDepositedAmount,
    totalLockLots,
    totalPrincipalLocked,
    totalReferrals,
    qualifiedReferrals
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
    prisma.referral.count(),
    prisma.referral.count({
      where: { qualified: true }
    })
  ]);

  res.json({
    totalUsers,
    totalDeposits,
    totalDepositedAmount: totalDepositedAmount._sum.amountMicro || 0,
    totalLockLots,
    totalPrincipalLocked: totalPrincipalLocked._sum.principalMicro || 0,
    totalReferrals,
    qualifiedReferrals
  });
}));

export default router;