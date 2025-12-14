import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function depositCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();

    try {
      logger.info(`User ${telegramUserId} requested deposit address`);

      // Get user data from backend
      const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
      const { user } = response.data;

      if (!user.depositAddress) {
        bot.sendMessage(msg.chat.id, `
❌ <b>No deposit address found!</b>

Please use /start to generate your deposit address.
        `, { parse_mode: 'HTML' });
        return;
      }

      const message = `
💳 <b>Your Deposit Address</b>

Send <b>≥101 USDT TRC20</b> to this address:

\`${user.depositAddress}\`

📋 <b>Important:</b>
• Minimum deposit: <b>101 USDT</b>
• Network: <b>TRON (TRC20)</b>
• Fee: <b>1 USDT</b> per deposit
• Funds locked for <b>30 days</b>
• Refer <b>1 user</b> to unlock

⚠️ <b>Warnings:</b>
• Only send USDT TRC20
• Do NOT send other tokens or networks
• Do NOT send from exchange directly (use wallet)

💡 <b>Tip:</b> Save this address for future deposits!

Use /balance to check your deposits.
Use /set_payout to set withdrawal address.
      `;

      bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Copy Address', callback_data: 'copy_address' }],
            [{ text: '💳 Balance', callback_data: 'show_balance' }],
            [{ text: '🔗 Referral', callback_data: 'show_referral' }]
          ]
        }
      });

    } catch (error: any) {
      logger.error('Error in deposit command:', error);
      
      if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error fetching deposit address. Please try again later.');
      }
    }
  };
}

export default depositCommand;