import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function refCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();

    try {
      logger.info(`User ${telegramUserId} requested referral info`);

      // Get user referral data from backend
      const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
      const { user } = response.data;

      const referralLink = `https://t.me/${config.telegramBotUsername}?start=ref_${user.referralCode}`;
      
      // Get referral statistics
      const qualifiedReferrals = user.referrals.filter((ref: any) => ref.qualified).length;
      const totalReferrals = user.referrals.length;

      const message = `
🔗 <b>Your Referral Program</b>

📢 <b>Your Referral Link:</b>
\`${referralLink}\`

📊 <b>Statistics:</b>
• Total referrals: ${totalReferrals}
• Qualified referrals: ${qualifiedReferrals}
• Success rate: ${totalReferrals > 0 ? Math.round((qualifiedReferrals / totalReferrals) * 100) : 0}%

🎯 <b>How it works:</b>
1. Share your referral link
2. User deposits ≥101 USDT
3. Your lot becomes eligible for withdrawal
4. Earn 15% reward on your principal

💡 <b>Pro Tips:</b>
• Share in crypto communities
• Explain the 15% reward benefit
• Help your referrals get started
• Build your network for passive income

📱 <b>Quick Share:</b>
Tap the button below to copy your link!
      `;

      bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Copy Link', callback_data: 'copy_referral_link' }],
            [{ text: '📊 My Referrals', callback_data: 'show_referrals' }],
            [{ text: '💳 Balance', callback_data: 'show_balance' }]
          ]
        }
      });

    } catch (error: any) {
      logger.error('Error in ref command:', error);
      
      if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error fetching referral information. Please try again later.');
      }
    }
  };
}

export default refCommand;