import express from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// List override requests (admin only)
router.get('/requests', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status 
  } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.overrideRequest.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { requestedAt: 'desc' },
      include: {
        lot: {
          include: {
            user: true,
            deposit: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.overrideRequest.count({ where })
  ]);

  res.json({
    requests,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get override request by ID (admin only)
router.get('/requests/:requestId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await prisma.overrideRequest.findUnique({
    where: { id: requestId },
    include: {
      lot: {
        include: {
          user: true,
          deposit: true
        }
      },
      requestedBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      approvedBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!request) {
    return res.status(404).json({ error: 'Override request not found' });
  }

  res.json({ request });
}));

// Create override request (admin only)
router.post('/requests', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { lotId, requestedChanges, reason, evidenceUrls } = req.body;
  const { userId } = req.user!;

  if (!lotId || !requestedChanges || !reason) {
    return res.status(400).json({ 
      error: 'lotId, requestedChanges, and reason are required' 
    });
  }

  if (reason.length < 50) {
    return res.status(400).json({ 
      error: 'Reason must be at least 50 characters long' 
    });
  }

  // Check if lot exists
  const lot = await prisma.lockLot.findUnique({
    where: { id: lotId },
    include: {
      user: true
    }
  });

  if (!lot) {
    return res.status(404).json({ error: 'Lot not found' });
  }

  // Only allow specific changes
  const allowedChanges = ['status', 'targetMet'];
  const requestedKeys = Object.keys(requestedChanges);
  
  if (!requestedKeys.every(key => allowedChanges.includes(key))) {
    return res.status(400).json({ 
      error: 'Only status and targetMet changes are allowed' 
    });
  }

  // Validate status transitions
  if (requestedChanges.status) {
    const validTransitions: Record<string, string[]> = {
      'MATURED_LOCKED': ['ELIGIBLE', 'CANCELLED'],
      'LOCKED': ['CANCELLED']
    };

    const currentStatus = lot.status;
    const newStatus = requestedChanges.status;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
      });
    }
  }

  // Ensure reward calculation remains the same
  if (requestedChanges.status === 'ELIGIBLE' && lot.status === 'MATURED_LOCKED') {
    // This ensures the full reward is paid as per policy
    requestedChanges.targetMet = true;
  }

  const request = await prisma.overrideRequest.create({
    data: {
      lotId,
      requestedByAdminId: userId,
      requestedChanges,
      reason,
      evidenceUrls: evidenceUrls || [],
      status: 'pending_approval'
    },
    include: {
      lot: {
        include: {
          user: true
        }
      },
      requestedBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      }
    }
  });

  logger.info(`Override request created for lot ${lotId} by admin ${userId}`, {
    requestId: request.id,
    requestedChanges,
    reason
  });

  res.json({ request });
}));

// Approve override request (SUPER_ADMIN only)
router.post('/requests/:requestId/approve', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { requestId } = req.params;
  const { userId } = req.user!;
  const { totpCode } = req.body;

  if (!totpCode) {
    return res.status(400).json({ error: 'TOTP code is required for approval' });
  }

  // Verify TOTP (implementation would check against stored secret)
  // This is a simplified check - in production, use proper TOTP verification
  if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
    return res.status(400).json({ error: 'Invalid TOTP code format' });
  }

  const request = await prisma.overrideRequest.findUnique({
    where: { id: requestId },
    include: {
      lot: true
    }
  });

  if (!request) {
    return res.status(404).json({ error: 'Override request not found' });
  }

  if (request.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Request is not pending approval' });
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update request status
    const updatedRequest = await tx.overrideRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvedByAdminId: userId,
        approvedAt: new Date()
      }
    });

    // Apply changes to lot
    const lotUpdateData: any = {};
    
    if (request.requestedChanges.status) {
      lotUpdateData.status = request.requestedChanges.status;
    }
    
    if (request.requestedChanges.targetMet !== undefined) {
      lotUpdateData.targetMet = request.requestedChanges.targetMet;
    }

    const updatedLot = await tx.lockLot.update({
      where: { id: request.lotId },
      data: lotUpdateData
    });

    // Create audit record
    const audit = await tx.overrideAudit.create({
      data: {
        overrideRequestId: requestId,
        lotId: request.lotId,
        userId: request.lot.userId,
        createdByAdminId: request.requestedByAdminId,
        approvedByAdminId: userId,
        oldStatus: request.lot.status,
        newStatus: updatedLot.status,
        oldTargetMet: request.lot.targetMet,
        newTargetMet: updatedLot.targetMet,
        reason: request.reason,
        evidenceUrls: request.evidenceUrls,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      }
    });

    return { request: updatedRequest, lot: updatedLot, audit };
  });

  logger.info(`Override request ${requestId} approved by SUPER_ADMIN ${userId}`, {
    lotId: request.lotId,
    requestedChanges: request.requestedChanges
  });

  res.json(result);
}));

// Reject override request (SUPER_ADMIN only)
router.post('/requests/:requestId/reject', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { requestId } = req.params;
  const { userId } = req.user!;
  const { reason } = req.body;

  const request = await prisma.overrideRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      rejectedAt: new Date()
    }
  });

  logger.info(`Override request ${requestId} rejected by SUPER_ADMIN ${userId}`, {
    rejectionReason: reason
  });

  res.json({ request });
}));

// Get override audit log (admin only)
router.get('/audit', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    userId,
    lotId,
    from, 
    to 
  } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (userId) where.userId = userId;
  if (lotId) where.lotId = lotId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const [audits, total] = await Promise.all([
    prisma.overrideAudit.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        lot: {
          include: {
            user: true
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.overrideAudit.count({ where })
  ]);

  res.json({
    audits,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export default router;