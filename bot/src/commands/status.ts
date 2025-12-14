import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function statusCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();

    try {
      logger.info(`User ${telegramUserId} requested status`);

      // Get comprehensive user data from backend
      const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
      const { user } = response.data;

      const message = formatStatusMessage(user);

      bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Balance', callback_data: 'show_balance' }],
            [{ text: '🔗 Referral', callback_data: 'show_referral' }],
            [{ text: '📋 History', callback_data: 'show_history' }]
          ]
        }
      });

    } catch (error: any) {
      logger.error('Error in status command:', error);
      
      if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error fetching status. Please try again later.');
      }
    }
  };
}

function formatStatusMessage(user: any): string {
  const totalPrincipal = user.lockLots.reduce((sum: number, lot: any) => sum + Number(lot.principalMicro), 0);
  const totalPrincipalUsdt = (totalPrincipal / 1000000).toFixed(2);
  
  const activeLots = user.lockLots.filter((lot: any) => lot.status === 'LOCKED');
  const eligibleLots = user.lockLots.filter((lot: any) => lot.status === 'ELIGIBLE');
  const maturedLockedLots = user.lockLots.filter((lot: any) => lot.status === 'MATURED_LOCKED');
  const paidLots = user.lockLots.filter((lot: any) => lot.status === 'PAID');

  const totalReferrals = user.referrals.length;
  const qualifiedReferrals = user.referrals.filter((ref: any) => ref.qualified).length;

  let message = `
📊 <b>Comprehensive Status Report</b>

👤 <b>Account Info:</b>
• Telegram ID: ${user.telegramUserId}
• Username: @${user.username || 'Not set'}
• Joined: ${new Date(user.createdAt).toLocaleDateString()}

💰 <b>Financial Overview:</b>
• Total Principal: ${totalPrincipalUsdt} USDT
• Total Deposits: ${user.deposits.length}
• Active Lots: ${activeLots.length}
• Eligible Lots: ${eligibleLots.length}
• Matured (Locked): ${maturedLockedLots.length}
• Paid Lots: ${paidLots.length}

👥 <b>Referral Program:</b>
• Total Referrals: ${totalReferrals}
• Qualified Referrals: ${qualifiedReferrals}
• Success Rate: ${totalReferrals > 0 ? Math.round((qualifiedReferrals / totalReferrals) * 100) : 0}%

`;

  if (activeLots.length > 0) {
    message += '<b>🔒 Active Lots Progress:</b>\n';
    activeLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const daysElapsed = Math.floor((Date.now() - new Date(lot.startAt).getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysElapsed);
      const progressPercent = Math.round((daysElapsed / 30) * 100);
      const projectedReward = Math.floor(lot.principalMicro * 0.15 * daysElapsed / 30);
      const projectedRewardUsdt = (projectedReward / 1000000).toFixed(2);
      
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      
      message += `
<b>Lot ${index + 1}:</b>
💵 Principal: ${principal} USDT
⏱️ Progress: ${progressBar} ${progressPercent}%
📅 Days: ${daysElapsed}/30 (${daysRemaining} left)
👥 Referrals: ${lot.targetMet ? '✅ 1/1' : '❌ 0/1'}
🏆 Reward: ${projectedRewardUsdt} USDT (${Math.round(daysElapsed / 30 * 15)}% of 15%)
`;
    });
  }

  if (eligibleLots.length > 0) {
    message += '\n<b>✅ Ready for Payout:</b>\n';
    eligibleLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const reward = ((lot.principalMicro * lot.rewardBps / 10000) / 1000000).toFixed(2);
      const total = (Number(principal) + Number(reward)).toFixed(2);
      
      message += `
<b>Lot ${index + 1}:</b>
💰 Total: ${total} USDT (Principal: ${principal} + Reward: ${reward})
📅 Matured: ${new Date(lot.unlockAt).toLocaleDateString()}
`;
    });
    
    message += '\n📝 Admin will process payouts manually.\n';
  }

  if (maturedLockedLots.length > 0) {
    message += '\n<b>⚠️ Action Required:</b>\n';
    message += `You have ${maturedLockedLots.length} matured lot(s) that are locked due to unmet referral requirements.\n\n`;
    message += '📞 Contact support for exceptional review.\n';
  }

  if (!user.payoutAddress) {
    message += `
🚨 <b>URGENT: Set Payout Address!</b>

You don't have a payout address set. This is required for withdrawals.

Use: /set_payout &lt;your_tron_address&gt;
    `;
  } else {
    message += `
💳 <b>Payout Address:</b>
<code>${user.payoutAddress}</code>

✅ Your payout address is set correctly.
    `;
  }

  message += `

💡 <b>Quick Actions:</b>
• /deposit - View deposit address
• /balance - Detailed balance
• /ref - Referral program
• /history - Transaction history
• /set_payout - Update payout address
  `;

  return message;
}

export default statusCommand;