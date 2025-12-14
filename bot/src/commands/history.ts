import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function historyCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message) => {
    const telegramUserId = msg.from!.id.toString();

    try {
      logger.info(`User ${telegramUserId} requested history`);

      // Get user history from backend
      const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
      const { user } = response.data;

      const message = formatHistoryMessage(user);

      bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Balance', callback_data: 'show_balance' }],
            [{ text: '🔗 Referral', callback_data: 'show_referral' }]
          ]
        }
      });

    } catch (error: any) {
      logger.error('Error in history command:', error);
      
      if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error fetching history. Please try again later.');
      }
    }
  };
}

function formatHistoryMessage(user: any): string {
  const recentDeposits = user.deposits
    .sort((a: any, b: any) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 5);

  const recentLots = user.lockLots
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  let message = `
📋 <b>Your History</b>

`;

  if (recentDeposits.length > 0) {
    message += '<b>💰 Recent Deposits:</b>\n';
    recentDeposits.forEach((deposit: any, index: number) => {
      const amount = (deposit.amountMicro / 1000000).toFixed(2);
      const date = new Date(deposit.detectedAt).toLocaleDateString();
      const statusEmoji = getStatusEmoji(deposit.status);
      const txHashShort = deposit.txHash.substring(0, 8) + '...';
      
      message += `
${index + 1}. ${statusEmoji} ${amount} USDT
   📅 ${date}
   🔗 ${txHashShort}
   📝 ${deposit.status}
`;
    });
  } else {
    message += '<b>💰 No deposits yet</b>\n\n';
  }

  if (recentLots.length > 0) {
    message += '\n<b>📊 Recent Lots:</b>\n';
    recentLots.forEach((lot: any, index: number) => {
      const principal = (lot.principalMicro / 1000000).toFixed(2);
      const date = new Date(lot.createdAt).toLocaleDateString();
      const statusEmoji = getLotStatusEmoji(lot.status);
      
      message += `
${index + 1}. ${statusEmoji} ${principal} USDT
   📅 ${date}
   📝 ${lot.status}
   👥 Referrals: ${lot.targetMet ? '✅' : '❌'}
`;
    });
  }

  if (user.referrals.length > 0) {
    const recentReferrals = user.referrals
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    message += '\n<b>👥 Recent Referrals:</b>\n';
    recentReferrals.forEach((ref: any, index: number) => {
      const username = ref.referred.username || 'Unknown';
      const date = new Date(ref.createdAt).toLocaleDateString();
      const status = ref.qualified ? '✅ Qualified' : '⏳ Pending';
      
      message += `
${index + 1}. @${username}
   📅 ${date}
   📝 ${status}
`;
    });
  }

  message += `
💡 Use /balance for detailed lot information.
Use /ref for referral statistics.
  `;

  return message;
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'detected': return '📡';
    case 'confirming': return '⏳';
    case 'confirmed': return '✅';
    case 'swept': return '💸';
    case 'failed': return '❌';
    default: return '📝';
  }
}

function getLotStatusEmoji(status: string): string {
  switch (status) {
    case 'LOCKED': return '🔒';
    case 'MATURED_LOCKED': return '⚠️';
    case 'ELIGIBLE': return '✅';
    case 'PAID': return '💰';
    case 'CANCELLED': return '❌';
    default: return '📝';
  }
}

export default historyCommand;