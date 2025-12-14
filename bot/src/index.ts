import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { logger } from './utils/logger';
import { startCommand } from './commands/start';
import { depositCommand } from './commands/deposit';
import { balanceCommand } from './commands/balance';
import { refCommand } from './commands/ref';
import { historyCommand } from './commands/history';
import { setPayoutCommand } from './commands/setPayout';
import { statusCommand } from './commands/status';

class TelegramBotService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(config.telegramBotToken, {
      polling: true,
      request: {
        url: config.backendUrl,
        timeout: 60000
      }
    });

    this.setupCommands();
    this.setupErrorHandling();
  }

  private setupCommands() {
    // Command handlers
    this.bot.onText(/\/start(?:\s+ref_(\w+))?/, startCommand(this.bot));
    this.bot.onText(/\/deposit/, depositCommand(this.bot));
    this.bot.onText(/\/balance/, balanceCommand(this.bot));
    this.bot.onText(/\/ref/, refCommand(this.bot));
    this.bot.onText(/\/history/, historyCommand(this.bot));
    this.bot.onText(/\/set_payout\s+(T\w{33})/, setPayoutCommand(this.bot));
    this.bot.onText(/\/status/, statusCommand(this.bot));
    this.bot.onText(/\/get_payout/, getPayoutCommand(this.bot));

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const helpText = `
🤖 <b>TRON Lock System Bot</b>

Available commands:

/start - Register and get your deposit address
/deposit - Show your deposit address
/balance - Check your balance and lots
/ref - Get your referral link and stats
/history - View your transaction history
/set_payout &lt;address&gt; - Set your payout address
/get_payout - Show current payout address
/status - Comprehensive status of all lots
/help - Show this help message

📊 <b>How it works:</b>
• Send ≥101 USDT TRC20 to your deposit address
• Funds are locked for 30 days
• Refer 1 user to unlock your funds + 15% reward
• Payouts are processed manually by admin

❗ <b>Important:</b>
• Only send USDT TRC20 on TRON network
• Minimum deposit: 101 USDT
• 1 USDT fee per deposit
• Set your payout address before requesting withdrawal
      `;

      this.bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'HTML' });
    });

    // Callback query handler
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
  }

  private setupErrorHandling() {
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
    });

    this.bot.on('error', (error) => {
      logger.error('Bot error:', error);
    });
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    try {
      const data = query.data;
      
      if (!data) return;

      const [action, ...params] = data.split(':');

      switch (action) {
        case 'refresh_balance':
          await this.refreshBalanceCallback(query);
          break;
        case 'lot_details':
          await this.lotDetailsCallback(query, params[0]);
          break;
        default:
          this.bot.answerCallbackQuery(query.id, { text: 'Unknown action' });
      }
    } catch (error) {
      logger.error('Callback query error:', error);
      this.bot.answerCallbackQuery(query.id, { text: 'Error processing request' });
    }
  }

  private async refreshBalanceCallback(query: TelegramBot.CallbackQuery) {
    const telegramUserId = query.from.id.toString();
    
    try {
      // Fetch fresh balance data from backend
      const balanceData = await this.fetchUserBalance(telegramUserId);
      
      const message = this.formatBalanceMessage(balanceData);
      
      this.bot.editMessageText(message, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔄 Refresh', callback_data: 'refresh_balance' },
            { text: '📊 Lots', callback_data: 'show_lots' }
          ]]
        }
      });

      this.bot.answerCallbackQuery(query.id, { text: 'Balance updated' });
    } catch (error) {
      logger.error('Error refreshing balance:', error);
      this.bot.answerCallbackQuery(query.id, { text: 'Failed to update balance' });
    }
  }

  private async lotDetailsCallback(query: TelegramBot.CallbackQuery, lotId: string) {
    try {
      const lotData = await this.fetchLotDetails(lotId);
      const message = this.formatLotDetailsMessage(lotData);
      
      this.bot.editMessageText(message, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '← Back', callback_data: 'show_balance' }
          ]]
        }
      });

      this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      logger.error('Error showing lot details:', error);
      this.bot.answerCallbackQuery(query.id, { text: 'Failed to load lot details' });
    }
  }

  private async fetchUserBalance(telegramUserId: string): Promise<any> {
    // Implementation would fetch from backend API
    // For now, return mock data
    return {
      totalPrincipal: 100000000,
      lots: [
        {
          id: 'lot1',
          principalMicro: 100000000,
          status: 'LOCKED',
          daysRemaining: 15,
          referralProgress: '0/1',
          projectedReward: 7500000
        }
      ],
      payoutAddress: null
    };
  }

  private async fetchLotDetails(lotId: string): Promise<any> {
    // Implementation would fetch from backend API
    return {
      id: lotId,
      principalMicro: 100000000,
      status: 'LOCKED',
      startAt: new Date(),
      unlockAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      targetMet: false,
      referralProgress: '0/1',
      rewardBps: 1500
    };
  }

  private formatBalanceMessage(data: any): string {
    const totalUsdt = (data.totalPrincipal / 1000000).toFixed(2);
    
    let message = `
💰 <b>Your Balance</b>

📊 <b>Total Principal:</b> ${totalUsdt} USDT

📋 <b>Active Lots:</b>
`;

    data.lots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const projectedReward = (lot.projectedReward / 1000000).toFixed(2);
      const statusEmoji = lot.status === 'LOCKED' ? '🔒' : lot.status === 'ELIGIBLE' ? '✅' : '⚠️';
      
      message += `
<b>Lot ${index + 1}:</b>
${statusEmoji} Status: ${lot.status}
💵 Principal: ${principal} USDT
⏱️ Days remaining: ${lot.daysRemaining || 'Matured'}
👥 Referrals: ${lot.referralProgress}
🏆 Projected reward: ${projectedReward} USDT
`;
    });

    if (!data.payoutAddress) {
      message += `
⚠️ <b>No payout address set!</b>
Use /set_payout to set your payout address.
      `;
    }

    return message;
  }

  private formatLotDetailsMessage(lot: any): string {
    const principal = (lot.principalMicro / 1000000).toFixed(2);
    const reward = ((lot.principalMicro * lot.rewardBps / 10000) / 1000000).toFixed(2);
    const totalPayout = ((lot.principalMicro + (lot.principalMicro * lot.rewardBps / 10000)) / 1000000).toFixed(2);
    
    return `
📋 <b>Lot Details</b>

💵 <b>Principal:</b> ${principal} USDT
🏆 <b>Reward (15%):</b> ${reward} USDT
💰 <b>Total Payout:</b> ${totalPayout} USDT

⏱️ <b>Timeline:</b>
Start: ${lot.startAt.toLocaleDateString()}
Unlock: ${lot.unlockAt.toLocaleDateString()}

👥 <b>Referral Requirement:</b>
Status: ${lot.targetMet ? '✅ Met' : '❌ Not met'}
Progress: ${lot.referralProgress}

🚦 <b>Status:</b> ${lot.status}
    `;
  }

  public start() {
    logger.info(`🤖 Telegram bot started`);
    logger.info(`📱 Bot username: @${config.telegramBotUsername}`);
  }
}

// Commands
function getPayoutCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();
    
    try {
      // Fetch user data from backend
      const userData = await fetchUserData(telegramUserId);
      
      if (!userData.payoutAddress) {
        bot.sendMessage(msg.chat.id, `
⚠️ <b>No payout address set!</b>

Your payout address is used to receive funds when your lots mature.

To set your payout address, use:
/set_payout &lt;your_tron_address&gt;

Example:
/set_payout TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, `
💳 <b>Your Payout Address</b>

<code>${userData.payoutAddress}</code>

✅ This address will be used for all payouts.

To change it, use:
/set_payout &lt;new_address&gt;
        `, { parse_mode: 'HTML' });
      }
    } catch (error) {
      logger.error('Error fetching payout address:', error);
      bot.sendMessage(msg.chat.id, '❌ Error fetching payout address. Please try again later.');
    }
  };
}

async function fetchUserData(telegramUserId: string): Promise<any> {
  // Implementation would fetch from backend API
  // For now, return mock data
  return {
    payoutAddress: null
  };
}

// Start the bot
const botService = new TelegramBotService();
botService.start();

export default botService;