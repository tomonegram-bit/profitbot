import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config';

export function startCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const telegramUserId = msg.from!.id.toString();
    const referralCode = match?.[1];

    try {
      logger.info(`User ${telegramUserId} started bot${referralCode ? ` with referral: ${referralCode}` : ''}`);

      // Register user in backend
      const response = await axios.post(`${config.backendUrl}/api/users/register`, {
        telegramUserId,
        username: msg.from!.username,
        firstName: msg.from!.first_name,
        lastName: msg.from!.last_name,
        referralCode
      });

      const { user, depositAddress, referralLink } = response.data;

      // Send welcome message
      const welcomeMessage = `
🎉 <b>Welcome to TRON Lock System!</b>

Your account has been created successfully.

💳 <b>Your Deposit Address:</b>
\`${depositAddress}\`

📋 <b>Important Instructions:</b>
• Send <b>≥101 USDT TRC20</b> to this address only
• Funds will be locked for <b>30 days</b>
• You need to refer <b>1 user</b> to unlock
• <b>1 USDT fee</b> applies to each deposit

🔗 <b>Your Referral Link:</b>
${referralLink}

Share this link to earn referral bonuses!

⚠️ <b>Warnings:</b>
• Only send USDT TRC20 on TRON network
• Do NOT send other tokens or networks
• Minimum deposit: 101 USDT
• Set payout address with /set_payout before withdrawal

Type /help for more information.
      `;

      bot.sendMessage(msg.chat.id, welcomeMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Deposit', callback_data: 'show_deposit' }],
            [{ text: '💳 Balance', callback_data: 'show_balance' }],
            [{ text: '🔗 Referral', callback_data: 'show_referral' }]
          ]
        }
      });

      // If user was referred, notify referrer
      if (referralCode) {
        await notifyReferrer(bot, referralCode, msg.from!);
      }

    } catch (error: any) {
      logger.error('Error in start command:', error);
      
      if (error.response?.data?.error === 'User already exists') {
        // User already exists, show their info
        await showExistingUserInfo(bot, msg);
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error creating account. Please try again later.');
      }
    }
  };
}

async function showExistingUserInfo(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramUserId = msg.from!.id.toString();

  try {
    const response = await axios.get(`${config.backendUrl}/api/users/telegram/${telegramUserId}`);
    const { user } = response.data;

    const message = `
👋 <b>Welcome back!</b>

💳 <b>Your Deposit Address:</b>
\`${user.depositAddress}\`

📊 <b>Quick Stats:</b>
• Total deposits: ${user.deposits.length}
• Active lots: ${user.lockLots.filter((lot: any) => lot.status === 'LOCKED').length}
• Matured lots: ${user.lockLots.filter((lot: any) => lot.status === 'ELIGIBLE').length}
• Referrals: ${user.referrals.length}

🔗 <b>Your Referral Link:</b>
https://t.me/${config.telegramBotUsername}?start=ref_${user.referralCode}

Use /balance to see detailed information.
Use /help for all commands.
    `;

    bot.sendMessage(msg.chat.id, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 Deposit', callback_data: 'show_deposit' }],
          [{ text: '💳 Balance', callback_data: 'show_balance' }],
          [{ text: '🔗 Referral', callback_data: 'show_referral' }]
        ]
      }
    });

  } catch (error) {
    logger.error('Error showing existing user info:', error);
    bot.sendMessage(msg.chat.id, '❌ Error loading user information. Please try again later.');
  }
}

async function notifyReferrer(bot: TelegramBot, referralCode: string, referredUser: TelegramBot.User) {
  try {
    // Get referrer info from backend
    const response = await axios.get(`${config.backendUrl}/api/users/referral/${referralCode}`);
    const { referrer } = response.data;

    if (referrer && referrer.telegramUserId) {
      const message = `
🎉 <b>New Referral!</b>

User @${referredUser.username || referredUser.first_name} has joined using your referral link.

👥 <b>Referral Progress:</b>
You need 1 qualified deposit from this user to unlock your lots.

🔗 <b>Your Referral Link:</b>
https://t.me/${config.telegramBotUsername}?start=ref_${referralCode}

Keep sharing to unlock your rewards faster!
      `;

      bot.sendMessage(referrer.telegramUserId, message, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logger.error('Error notifying referrer:', error);
  }
}

export default startCommand;