/**
 * Development-only simple server for testing without Redis/Prisma connection
 * This server provides mock endpoints for frontend development
 */
import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';

// Load .env.local from parent directory (workspace root)
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Simple logger (no complex config)
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg: string, err?: any) => console.warn(`[WARN] ${msg}`, err || ''),
};

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
  password: 'admin123', // In production, this would be hashed
  role: 'ADMIN',
  totp_secret: 'test-secret-123',
};

// Health check
app.get('/health', (req, res) => {
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

// Login endpoint
app.post('/auth/admin/login', (req, res) => {
  try {
    const { email, password, totp_code } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Check credentials
    if (email !== mockAdmin.email || password !== mockAdmin.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // For development, TOTP is optional
    logger.info(`Admin login attempt: ${email}`);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
      },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
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
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get admin user info
app.get('/auth/admin/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
      );
      res.json({
        id: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
      });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const port = 3000;
app.listen(port, () => {
  logger.info(`🚀 Development server running on port ${port}`);
  logger.info(`📝 Using mock database`);
  logger.info(`✅ Default admin: admin@example.com / admin123`);
});
