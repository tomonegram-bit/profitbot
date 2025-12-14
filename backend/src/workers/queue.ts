import { Queue, Worker, Job } from 'bullmq';
import { createRedis } from '../utils/redis';
import { logger } from '../utils/logger';
import config from '../config';

// Job types
export type JobData = {
  type: 'scan_deposits' | 'process_deposit' | 'execute_sweep' | 'check_confirmations' | 
        'evaluate_referrals' | 'mature_lots' | 'topup_trx' | 'monitor_ops_wallet';
  [key: string]: any;
};

export function setupWorkerQueue() {
  const connection = {
    host: config.redisUrl.includes('@') 
      ? config.redisUrl.split('@')[1].split(':')[0]
      : config.redisUrl.split('://')[1].split(':')[0],
    port: parseInt(config.redisUrl.split(':').pop() || '6379'),
  };

  // Create queues
  const depositQueue = new Queue('deposits', { connection });
  const sweepQueue = new Queue('sweeps', { connection });
  const referralQueue = new Queue('referrals', { connection });
  const maturityQueue = new Queue('maturity', { connection });
  const trxQueue = new Queue('trx', { connection });

  // Setup workers
  setupDepositWorker(connection);
  setupSweepWorker(connection);
  setupReferralWorker(connection);
  setupMaturityWorker(connection);
  setupTrxWorker(connection);

  logger.info('Worker queues initialized');
  
  return {
    depositQueue,
    sweepQueue,
    referralQueue,
    maturityQueue,
    trxQueue,
    async close() {
      await Promise.all([
        depositQueue.close(),
        sweepQueue.close(),
        referralQueue.close(),
        maturityQueue.close(),
        trxQueue.close()
      ]);
    }
  };
}

// Export a singleton workerQueue for services to use
export const workerQueue = setupWorkerQueue();

function setupDepositWorker(connection: any) {
  const depositWorker = new Worker('deposits', async (job: Job) => {
    logger.info(`Processing deposit job: ${job.id}`, job.data);
    
    try {
      switch (job.data.type) {
        case 'scan_deposits':
          await scanDeposits(job.data);
          break;
        case 'process_deposit':
          await processDeposit(job.data);
          break;
        case 'check_confirmations':
          await checkConfirmations(job.data);
          break;
        default:
          logger.warn(`Unknown deposit job type: ${job.data.type}`);
      }
    } catch (error) {
      logger.error(`Error processing deposit job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  depositWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Deposit job ${job?.id} failed:`, err);
  });
}

function setupSweepWorker(connection: any) {
  const sweepWorker = new Worker('sweeps', async (job: Job) => {
    logger.info(`Processing sweep job: ${job.id}`, job.data);
    
    try {
      switch (job.data.type) {
        case 'execute_sweep':
          await executeSweep(job.data);
          break;
        default:
          logger.warn(`Unknown sweep job type: ${job.data.type}`);
      }
    } catch (error) {
      logger.error(`Error processing sweep job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  sweepWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Sweep job ${job?.id} failed:`, err);
  });
}

function setupReferralWorker(connection: any) {
  const referralWorker = new Worker('referrals', async (job: Job) => {
    logger.info(`Processing referral job: ${job.id}`, job.data);
    
    try {
      switch (job.data.type) {
        case 'evaluate_referrals':
          await evaluateReferrals(job.data);
          break;
        default:
          logger.warn(`Unknown referral job type: ${job.data.type}`);
      }
    } catch (error) {
      logger.error(`Error processing referral job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  referralWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Referral job ${job?.id} failed:`, err);
  });
}

function setupMaturityWorker(connection: any) {
  const maturityWorker = new Worker('maturity', async (job: Job) => {
    logger.info(`Processing maturity job: ${job.id}`, job.data);
    
    try {
      switch (job.data.type) {
        case 'mature_lots':
          await matureLots(job.data);
          break;
        default:
          logger.warn(`Unknown maturity job type: ${job.data.type}`);
      }
    } catch (error) {
      logger.error(`Error processing maturity job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  maturityWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Maturity job ${job?.id} failed:`, err);
  });
}

function setupTrxWorker(connection: any) {
  const trxWorker = new Worker('trx', async (job: Job) => {
    logger.info(`Processing TRX job: ${job.id}`, job.data);
    
    try {
      switch (job.data.type) {
        case 'topup_trx':
          await topupTrx(job.data);
          break;
        case 'monitor_ops_wallet':
          await monitorOpsWallet(job.data);
          break;
        default:
          logger.warn(`Unknown TRX job type: ${job.data.type}`);
      }
    } catch (error) {
      logger.error(`Error processing TRX job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  trxWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`TRX job ${job?.id} failed:`, err);
  });
}

// Job implementations (these would be imported from separate worker files)
async function scanDeposits(data: any) {
  // Implementation would go here
  logger.info('Scanning deposits...', data);
}

async function processDeposit(data: any) {
  // Implementation would go here
  logger.info('Processing deposit...', data);
}

async function checkConfirmations(data: any) {
  // Implementation would go here
  logger.info('Checking confirmations...', data);
}

async function executeSweep(data: any) {
  // Implementation would go here
  logger.info('Executing sweep...', data);
}

async function evaluateReferrals(data: any) {
  // Implementation would go here
  logger.info('Evaluating referrals...', data);
}

async function matureLots(data: any) {
  // Implementation would go here
  logger.info('Maturing lots...', data);
}

async function topupTrx(data: any) {
  // Implementation would go here
  logger.info('Topping up TRX...', data);
}

async function monitorOpsWallet(data: any) {
  // Implementation would go here
  logger.info('Monitoring OPS wallet...', data);
}