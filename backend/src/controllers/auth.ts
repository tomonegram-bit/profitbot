import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import config from '../config';
import { encrypt } from '../utils/encryption';

const router = express.Router();

// Admin login
router.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password, totpCode } = req.body;

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check TOTP if enabled
  if (admin.totpEnabled) {
    if (!totpCode) {
      return res.status(401).json({ error: 'TOTP code required' });
    }

    const secret = admin.totpSecret;
    if (!secret) {
      return res.status(500).json({ error: 'TOTP not configured properly' });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: totpCode,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid TOTP code' });
    }
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    config.jwtSecret as jwt.Secret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );

  res.json({
    token,
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      totpEnabled: admin.totpEnabled
    }
  });
}));

// Setup TOTP for admin
router.post('/admin/setup-totp', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.user!;

  const admin = await prisma.adminUser.findUnique({ where: { id: userId } });
  
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }

  if (admin.totpEnabled) {
    return res.status(400).json({ error: 'TOTP already enabled' });
  }

  const secret = speakeasy.generateSecret({
    name: `${config.totpServiceName}:${admin.email}`,
    length: 32
  });

  // Store encrypted secret
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: encrypt(secret.base32) }
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  res.json({
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.otpauth_url
  });
}));

// Verify TOTP setup
router.post('/admin/verify-totp', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.user!;
  const { code } = req.body;

  const admin = await prisma.adminUser.findUnique({ where: { id: userId } });
  
  if (!admin || !admin.totpSecret) {
    return res.status(400).json({ error: 'TOTP not configured' });
  }

  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    return res.status(400).json({ error: 'Invalid TOTP code' });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: true }
  });

  res.json({ success: true });
}));

// Get current admin profile
router.get('/admin/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.user!;

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      totpEnabled: true,
      lastLoginAt: true,
      createdAt: true
    }
  });

  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }

  res.json({ admin });
}));

export default router;