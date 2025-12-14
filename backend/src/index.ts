import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { createRedis } from './utils/redis';
import { setupWorkerQueue } from './workers/queue';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import config from './config';

// Import routes
import authRoutes from './controllers/auth';
import userRoutes from './controllers/users';
import depositRoutes from './controllers/deposits';
import lotRoutes from './controllers/lots';
import payoutRoutes from './controllers/payouts';
import adminRoutes from './controllers/admin';
import overrideRoutes from './controllers/overrides';

const app = express();
export const prisma = new PrismaClient();
export let redis: any;
export let workerQueue: any;

async function startServer() {
  try {
    // Initialize Redis
    redis = await createRedis();
    logger.info('Redis connected successfully');

    // Initialize Worker Queue
    workerQueue = setupWorkerQueue();
    logger.info('Worker queue initialized');

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com', 'https://admin.your-domain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    if (process.env.NODE_ENV !== 'test') {
      app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        network: config.network,
        uptime: process.uptime()
      });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/deposits', depositRoutes);
    app.use('/api/lots', lotRoutes);
    app.use('/api/payouts', payoutRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/overrides', overrideRoutes);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Start server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Network: ${config.network}`);
      logger.info(`💰 USDT Contract: ${config.usdtContractAddress}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await prisma.$disconnect();
      if (redis) await redis.disconnect();
      if (workerQueue) await workerQueue.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await prisma.$disconnect();
      if (redis) await redis.disconnect();
      if (workerQueue) await workerQueue.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;