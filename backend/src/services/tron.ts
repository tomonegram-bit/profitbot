import TronWeb from 'tronweb';
import config from '../config';
import { logger } from '../utils/logger';

class TronService {
  private tronWeb: TronWeb;
  private usdtContract: any;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: config.tronFullNode,
      headers: config.trongridApiKey ? { 'TRON-PRO-API-KEY': config.trongridApiKey } : {},
      privateKey: config.opsTrxWalletPrivateKeyEncrypted
    });

    this.initializeContract();
  }

  private async initializeContract() {
    try {
      this.usdtContract = await this.tronWeb.contract().at(config.usdtContractAddress);
      logger.info('USDT contract initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize USDT contract:', error);
      throw error;
    }
  }

  // Generate new TRON account
  generateAccount(): { address: string; privateKey: string; publicKey: string } {
    const account = this.tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey
    };
  }

  // Validate TRON address
  validateAddress(address: string): boolean {
    return this.tronWeb.isAddress(address);
  }

  // Get TRX balance
  async getTrxBalance(address: string): Promise<number> {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error) {
      logger.error(`Failed to get TRX balance for ${address}:`, error);
      throw error;
    }
  }

  // Get USDT balance
  async getUsdtBalance(address: string): Promise<number> {
    try {
      if (!this.usdtContract) {
        await this.initializeContract();
      }
      
      const balance = await this.usdtContract.methods.balanceOf(address).call();
      return balance / config.microUnit;
    } catch (error) {
      logger.error(`Failed to get USDT balance for ${address}:`, error);
      throw error;
    }
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<any> {
    try {
      return await this.tronWeb.trx.getTransaction(txHash);
    } catch (error) {
      logger.error(`Failed to get transaction ${txHash}:`, error);
      throw error;
    }
  }

  // Get transaction info (includes receipt)
  async getTransactionInfo(txHash: string): Promise<any> {
    try {
      return await this.tronWeb.trx.getTransactionInfo(txHash);
    } catch (error) {
      logger.error(`Failed to get transaction info ${txHash}:`, error);
      throw error;
    }
  }

  // Get current block number
  async getCurrentBlock(): Promise<number> {
    try {
      const block = await this.tronWeb.trx.getCurrentBlock();
      return block.block_header.raw_data.number;
    } catch (error) {
      logger.error('Failed to get current block:', error);
      throw error;
    }
  }

  // Get block by number
  async getBlock(blockNumber: number): Promise<any> {
    try {
      return await this.tronWeb.trx.getBlock(blockNumber);
    } catch (error) {
      logger.error(`Failed to get block ${blockNumber}:`, error);
      throw error;
    }
  }

  // Send TRX
  async sendTrx(fromPrivateKey: string, toAddress: string, amount: number): Promise<string> {
    try {
      const tradeobj = await this.tronWeb.transactionBuilder.sendTrx(
        toAddress,
        this.tronWeb.toSun(amount),
        this.tronWeb.address.fromPrivateKey(fromPrivateKey)
      );
      
      const signedtxn = await this.tronWeb.trx.sign(tradeobj, fromPrivateKey);
      const receipt = await this.tronWeb.trx.sendRawTransaction(signedtxn);
      
      return receipt.txid;
    } catch (error) {
      logger.error(`Failed to send TRX:`, error);
      throw error;
    }
  }

  // Send USDT (TRC20)
  async sendUsdt(fromPrivateKey: string, toAddress: string, amount: number): Promise<string> {
    try {
      if (!this.usdtContract) {
        await this.initializeContract();
      }

      const amountMicro = Math.floor(amount * config.microUnit);
      
      const tradeobj = await this.usdtContract.methods.transfer(toAddress, amountMicro).send();
      return tradeobj;
    } catch (error) {
      logger.error(`Failed to send USDT:`, error);
      throw error;
    }
  }

  // Get USDT transfer events for an address
  async getUsdtTransferEvents(address: string, fromBlock: number, toBlock: number): Promise<any[]> {
    try {
      const events = await this.tronWeb.getEventResult(config.usdtContractAddress, {
        eventName: 'Transfer',
        fromBlock,
        toBlock,
        filters: { to: address }
      });
      
      return events;
    } catch (error) {
      logger.error(`Failed to get USDT transfer events for ${address}:`, error);
      throw error;
    }
  }

  // Estimate energy required for a transaction
  async estimateEnergy(transaction: any): Promise<number> {
    try {
      const result = await this.tronWeb.trx.estimateEnergy(transaction);
      return result.energy_required;
    } catch (error) {
      logger.error('Failed to estimate energy:', error);
      throw error;
    }
  }

  // Get account resources
  async getAccountResources(address: string): Promise<any> {
    try {
      return await this.tronWeb.trx.getAccountResources(address);
    } catch (error) {
      logger.error(`Failed to get account resources for ${address}:`, error);
      throw error;
    }
  }

  // Check if address has enough resources
  async hasEnoughResources(address: string, requiredEnergy: number = 0, requiredBandwidth: number = 0): Promise<boolean> {
    try {
      const resources = await this.getAccountResources(address);
      
      const freeNetLimit = resources.freeNetLimit || 0;
      const freeNetUsed = resources.freeNetUsed || 0;
      const netLimit = resources.NetLimit || 0;
      const netUsed = resources.NetUsed || 0;
      const energyLimit = resources.EnergyLimit || 0;
      const energyUsed = resources.EnergyUsed || 0;

      const availableBandwidth = (freeNetLimit - freeNetUsed) + (netLimit - netUsed);
      const availableEnergy = energyLimit - energyUsed;

      return availableEnergy >= requiredEnergy && availableBandwidth >= requiredBandwidth;
    } catch (error) {
      logger.error(`Failed to check resources for ${address}:`, error);
      return false;
    }
  }
}

export const tronService = new TronService();