import { prisma } from '../index';
import { tronService } from './tron';
import { logger } from '../utils/logger';
import config from '../config';
import { workerQueue } from '../workers/queue';

export class DepositScanner {
  private isRunning = false;
  private lastProcessedBlock = 0;

  async start() {
    if (this.isRunning) {
      logger.warn('Deposit scanner already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting deposit scanner');

    try {
      // Get the last processed block from database
      const lastBlock = await prisma.config.findUnique({
        where: { key: 'last_processed_block' }
      });

      this.lastProcessedBlock = lastBlock?.value?.blockNumber || 
        (await tronService.getCurrentBlock()) - 100;

      await this.scanLoop();
    } catch (error) {
      logger.error('Error starting deposit scanner:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    this.isRunning = false;
    logger.info('Stopping deposit scanner');
  }

  private async scanLoop() {
    while (this.isRunning) {
      try {
        await this.scanOnce();
        await this.sleep(10000); // 10 second delay between scans
      } catch (error) {
        logger.error('Error in scan loop:', error);
        await this.sleep(30000); // 30 second delay on error
      }
    }
  }

  private async scanOnce() {
    const currentBlock = await tronService.getCurrentBlock();
    
    if (currentBlock <= this.lastProcessedBlock) {
      return; // No new blocks
    }

    logger.info(`Scanning blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);

    // Get all user deposit addresses
    const users = await prisma.user.findMany({
      select: {
        id: true,
        depositAddress: true
      }
    });

    const depositAddresses = users.map(u => u.depositAddress);

    if (depositAddresses.length === 0) {
      this.lastProcessedBlock = currentBlock;
      await this.saveLastProcessedBlock();
      return;
    }

    // Scan for USDT transfers to deposit addresses
    for (const address of depositAddresses) {
      try {
        await this.scanAddressForDeposits(address, this.lastProcessedBlock + 1, currentBlock);
      } catch (error) {
        logger.error(`Error scanning address ${address}:`, error);
      }
    }

    this.lastProcessedBlock = currentBlock;
    await this.saveLastProcessedBlock();
  }

  private async scanAddressForDeposits(address: string, fromBlock: number, toBlock: number) {
    try {
      const events = await tronService.getUsdtTransferEvents(address, fromBlock, toBlock);

      for (const event of events) {
        await this.processDepositEvent(event, address);
      }
    } catch (error) {
      logger.error(`Error scanning address ${address} for deposits:`, error);
      throw error;
    }
  }

  private async processDepositEvent(event: any, depositAddress: string) {
    const txHash = event.transaction_id;
    const fromAddress = event.result.from;
    const amountMicro = parseInt(event.result.value);

    // Check if deposit already exists
    const existingDeposit = await prisma.deposit.findUnique({
      where: { txHash }
    });

    if (existingDeposit) {
      logger.debug(`Deposit ${txHash} already exists, skipping`);
      return;
    }

    // Validate minimum deposit
    if (amountMicro < config.minDepositMicro) {
      logger.warn(`Deposit ${txHash} below minimum: ${amountMicro} < ${config.minDepositMicro}`);
      return;
    }

    // Find user by deposit address
    const user = await prisma.user.findFirst({
      where: { depositAddress }
    });

    if (!user) {
      logger.error(`No user found for deposit address ${depositAddress}`);
      return;
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        txHash,
        fromAddress,
        amountMicro: amountMicro.toString(),
        status: 'detected',
        confirmations: 0,
        blockNumber: event.block_number
      }
    });

    logger.info(`New deposit detected: ${txHash}`, {
      userId: user.id,
      amount: amountMicro,
      depositId: deposit.id
    });

    // Queue confirmation check
    await workerQueue.depositQueue.add('check_confirmations', {
      depositId: deposit.id,
      txHash
    }, {
      delay: 60000 // Check after 1 minute
    });
  }

  private async saveLastProcessedBlock() {
    await prisma.config.upsert({
      where: { key: 'last_processed_block' },
      update: {
        value: { blockNumber: this.lastProcessedBlock }
      },
      create: {
        key: 'last_processed_block',
        value: { blockNumber: this.lastProcessedBlock }
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const depositScanner = new DepositScanner();