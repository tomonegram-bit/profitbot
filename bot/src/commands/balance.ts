import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function balanceCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();

    try {
      logger.info(`User ${telegramUserId} requested balance`);

      // Get user balance from backend
      const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
      const { user } = response.data;

      if (!user) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account.
        `, { parse_mode: 'HTML' });
        return;
      }

      const message = formatBalanceMessage(user);

      bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Refresh', callback_data: 'refresh_balance' }],
            [{ text: '📊 Lot Details', callback_data: 'show_lots' }],
            [{ text: '💳 Deposit', callback_data: 'show_deposit' }],
            [{ text: '🔗 Referral', callback_data: 'show_referral' }]
          ]
        }
      });

    } catch (error: any) {
      logger.error('Error in balance command:', error);
      
      if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error fetching balance. Please try again later.');
      }
    }
  };
}

function formatBalanceMessage(user: any): string {
  const activeLots = user.lockLots.filter((lot: any) => lot.status === 'LOCKED');
  const eligibleLots = user.lockLots.filter((lot: any) => lot.status === 'ELIGIBLE');
  const maturedLockedLots = user.lockLots.filter((lot: any) => lot.status === 'MATURED_LOCKED');
  const paidLots = user.lockLots.filter((lot: any) => lot.status === 'PAID');

  const totalPrincipal = user.lockLots.reduce((sum: number, lot: any) => sum + Number(lot.principalMicro), 0);
  const totalPrincipalUsdt = (totalPrincipal / 1000000).toFixed(2);

  let message = `
💰 <b>Your Balance Overview</b>

📊 <b>Total Principal:</b> ${totalPrincipalUsdt} USDT

📋 <b>Lots Summary:</b>
• 🔒 Active (Locked): ${activeLots.length}
• ✅ Eligible: ${eligibleLots.length}
• ⚠️ Matured (Locked): ${maturedLockedLots.length}
• 💰 Paid: ${paidLots.length}

`;

  if (activeLots.length > 0) {
    message += '<b>🔒 Active Lots:</b>\n';
    activeLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const daysElapsed = Math.floor((Date.now() - new Date(lot.startAt).getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysElapsed);
      const projectedReward = Math.floor(lot.principalMicro * 0.15 * daysElapsed / 30);
      const projectedRewardUsdt = (projectedReward / 1000000).toFixed(2);
      const referralProgress = lot.targetMet ? '✅ 1/1' : '❌ 0/1';
      
      message += `
<b>Lot ${index + 1}:</b>
💵 Principal: ${principal} USDT
⏱️ Progress: Day ${daysElapsed}/30 (${daysRemaining} days left)
👥 Referrals: ${referralProgress}
🏆 Projected reward: ${projectedRewardUsdt} USDT
`;
    });
  }

  if (eligibleLots.length > 0) {
    message += '\n<b>✅ Eligible Lots (Ready for Payout):</b>\n';
    eligibleLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const reward = ((lot.principalMicro * lot.rewardBps / 10000) / 1000000).toFixed(2);
      const total = (Number(principal) + Number(reward)).toFixed(2);
      
      message += `
<b>Lot ${index + 1}:</b>
💰 Total payout: ${total} USDT (Principal: ${principal} + Reward: ${reward})
`;
    });
  }

  if (maturedLockedLots.length > 0) {
    message += '\n<b>⚠️ Matured Lots (Locked - Referral Required):</b>\n';
    maturedLockedLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      message += `
<b>Lot ${index + 1}:</b>
💵 Principal: ${principal} USDT
Status: Matured but locked (referral target not met)
`;
    });
    
    message += '\n📝 Contact support to review these lots.\n';
  }

  if (!user.payoutAddress) {
    message += `
⚠️ <b>Important:</b>
No payout address set!
Use /set_payout &lt;address&gt; to set your withdrawal address.
    `;
  } else {
    message += `
💳 <b>Payout Address:</b>
<code>${user.payoutAddress}</code>

Use /get_payout to view or /set_payout to change.
    `;
  }

  return message;
}

export default balanceCommand;