#!/usr/bin/env ts-node
/**
 * Standalone development server for testing without Redis/Prisma
 * Does not require any workspace config files
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock admin user
const mockAdmin = {
  id: 1,
  email: 'admin@example.com',
  password: 'admin123',
  role: 'ADMIN',
  totp_secret: 'test-secret-123',
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/admin/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    database: 'mock',
    redis: 'mock',
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint - both with and without /api prefix
const handleAdminLogin = (req, res) => {
  try {
    const { email, password, totp_code } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    if (email !== mockAdmin.email || password !== mockAdmin.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    console.log(`[INFO] Admin login attempt: ${email}`);

    const token = jwt.sign(
      {
        id: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
      },
    });
  } catch (error) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// Register login endpoint with both routes
app.post('/auth/admin/login', handleAdminLogin);
app.post('/api/auth/admin/login', handleAdminLogin);

// Get admin user info endpoint
const handleGetAdminMe = (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        admin: {
          id: mockAdmin.id,
          email: mockAdmin.email,
          role: mockAdmin.role,
        },
      });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register profile endpoints
app.get('/auth/admin/me', handleGetAdminMe);
app.get('/api/auth/profile', handleGetAdminMe);
app.get('/api/auth/admin/me', handleGetAdminMe);

// Dashboard stats (mock)
app.get('/admin/stats', (req, res) => {
  res.json({
    totalUsers: 150,
    totalDeposits: 500000,
    totalPayouts: 250000,
    activeLoans: 45,
    activeReferrals: 320,
  });
});

// Users list (mock)
app.get('/api/users', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        email: 'user1@example.com',
        telegram_id: '123456789',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'user2@example.com',
        telegram_id: '987654321',
        created_at: new Date().toISOString(),
      },
    ],
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Development server running on port ${port}`);
  console.log(`📝 Using mock database`);
  console.log(`✅ Default admin: admin@example.com / admin123`);
  console.log(`🔗 Backend URL: http://localhost:${port}`);
});
