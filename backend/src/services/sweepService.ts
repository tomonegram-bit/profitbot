import { prisma } from '../index';
import { tronService } from './tron';
import { logger } from '../utils/logger';
import config from '../config';
import { decrypt } from '../utils/encryption';
import { workerQueue } from '../workers/queue';

export class SweepService {
  async executeSweep(depositId: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        user: true,
        sweep: true
      }
    });

    if (!deposit) {
      throw new Error(`Deposit ${depositId} not found`);
    }

    if (deposit.status !== 'confirmed') {
      throw new Error(`Deposit ${depositId} not confirmed`);
    }

    if (deposit.sweep) {
      // Resume existing sweep
      return await this.resumeSweep(deposit.sweep);
    }

    // Create new sweep
    const sweep = await prisma.sweep.create({
      data: {
        depositId,
        status: 'pending'
      }
    });

    return await this.executeSweepLegs(sweep, deposit);
  }

  private async resumeSweep(sweep: any) {
    const deposit = await prisma.deposit.findUnique({
      where: { id: sweep.depositId }
    });

    if (!deposit) {
      throw new Error(`Deposit ${sweep.depositId} not found`);
    }

    return await this.executeSweepLegs(sweep, deposit);
  }

  private async executeSweepLegs(sweep: any, deposit: any) {
    const depositAddress = deposit.user.depositAddress;
    const privateKeyRef = deposit.user.depositAddressKeyRef;
    
    if (!privateKeyRef) {
      throw new Error(`No private key for deposit address ${depositAddress}`);
    }

    const privateKey = decrypt(privateKeyRef);
    const amountMicro = BigInt(deposit.amountMicro);
    const principalMicro = amountMicro - BigInt(config.fixedFeeMicro);

    try {
      // Check and topup TRX if needed
      await this.ensureTrxBalance(depositAddress, privateKey);

      // Execute cold leg (principal to cold wallet)
      if (sweep.coldLegStatus !== 'completed') {
        const coldLegTxHash = await this.executeColdLeg(
          privateKey,
          depositAddress,
          principalMicro
        );

        await prisma.sweep.update({
          where: { id: sweep.id },
          data: {
            coldLegTxHash,
            coldLegStatus: 'completed',
            coldLegBroadcastAt: new Date()
          }
        });

        logger.info(`Cold leg executed for deposit ${deposit.id}`, {
          txHash: coldLegTxHash,
          amount: principalMicro.toString()
        });
      }

      // Execute fee leg (1 USDT to fee wallet)
      if (sweep.feeLegStatus !== 'completed') {
        const feeLegTxHash = await this.executeFeeLeg(
          privateKey,
          depositAddress
        );

        await prisma.sweep.update({
          where: { id: sweep.id },
          data: {
            feeLegTxHash,
            feeLegStatus: 'completed',
            feeLegBroadcastAt: new Date()
          }
        });

        logger.info(`Fee leg executed for deposit ${deposit.id}`, {
          txHash: feeLegTxHash,
          amount: config.fixedFeeMicro
        });
      }

      // Mark sweep as completed
      const completedSweep = await prisma.sweep.update({
        where: { id: sweep.id },
        data: {
          status: 'completed'
        }
      });

      // Update deposit status
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'swept' }
      });

      // Create lock lot
      await this.createLockLot(deposit);

      return completedSweep;

    } catch (error) {
      logger.error(`Error executing sweep for deposit ${deposit.id}:`, error);

      // Determine if it's a resource issue
      const needsFee = await this.checkResourceIssue(error);
      
      await prisma.sweep.update({
        where: { id: sweep.id },
        data: {
          status: needsFee ? 'needs_fee' : 'failed',
          error: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    }
  }

  private async ensureTrxBalance(address: string, privateKey: string) {
    const balance = await tronService.getTrxBalance(address);
    const minBalance = 10; // Minimum 10 TRX needed

    if (balance < minBalance) {
      logger.info(`Topping up TRX for ${address}`, {
        currentBalance: balance,
        topupAmount: config.trxTopupAmount
      });

      const topupTxHash = await tronService.sendTrx(
        config.opsTrxWalletPrivateKeyEncrypted,
        address,
        config.trxTopupAmount
      );

      // Log the topup
      await prisma.trxTopUp.create({
        data: {
          depositAddress: address,
          amountTrx: config.trxTopupAmount,
          txHash: topupTxHash,
          purpose: 'sweep_prep'
        }
      });

      // Wait for confirmation
      await this.waitForConfirmation(topupTxHash);
    }
  }

  private async executeColdLeg(privateKey: string, fromAddress: string, amountMicro: bigint): Promise<string> {
    return await tronService.sendUsdt(privateKey, config.adminColdWallet, Number(amountMicro) / 1e6);
  }

  private async executeFeeLeg(privateKey: string, fromAddress: string): Promise<string> {
    return await tronService.sendUsdt(privateKey, config.adminFeeWallet, config.fixedFeeUsdt);
  }

  private async createLockLot(deposit: any) {
    const principalMicro = BigInt(deposit.amountMicro) - BigInt(config.fixedFeeMicro);
    const unlockAt = new Date(Date.now() + (config.lockDurationDays * 24 * 60 * 60 * 1000));

    const lockLot = await prisma.lockLot.create({
      data: {
        userId: deposit.userId,
        depositId: deposit.id,
        principalMicro: principalMicro.toString(),
        startAt: new Date(),
        unlockAt,
        status: 'LOCKED',
        targetMet: false,
        requiredReferrals: config.requiredReferrals,
        rewardBps: config.rewardBps
      }
    });

    logger.info(`Lock lot created for deposit ${deposit.id}`, {
      lotId: lockLot.id,
      principal: principalMicro.toString()
    });

    // Queue referral evaluation
    await workerQueue.referralQueue.add('evaluate_referrals', {
      userId: deposit.userId,
      lotId: lockLot.id
    });
  }

  private async checkResourceIssue(error: any): Promise<boolean> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorMessage.includes('energy') || 
           errorMessage.includes('bandwidth') || 
           errorMessage.includes('balance');
  }

  private async waitForConfirmation(txHash: string, maxWait = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const txInfo = await tronService.getTransactionInfo(txHash);
        if (txInfo.blockNumber) {
          return; // Transaction confirmed
        }
      } catch (error) {
        // Transaction not found yet
      }
      
      await this.sleep(2000);
    }

    throw new Error(`Transaction ${txHash} not confirmed within ${maxWait}ms`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const sweepService = new SweepService();