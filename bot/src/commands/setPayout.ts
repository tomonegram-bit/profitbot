import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

export function setPayoutCommand(bot: TelegramBot) {
  return async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const telegramUserId = msg.from!.id.toString();
    const payoutAddress = match?.[1];

    if (!payoutAddress) {
      bot.sendMessage(msg.chat.id, `
❌ <b>Invalid command format!</b>

Usage: /set_payout &lt;TRON_ADDRESS&gt;

Example:
/set_payout TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

⚠️ <b>Important:</b>
• Address must start with 'T'
• Must be 34 characters long
• Must be a valid TRON address
• This address will receive all your payouts

💡 <b>Security Tips:</b>
• Use your own wallet address
• Double-check the address before confirming
• Test with a small amount first if unsure
      `, { parse_mode: 'HTML' });
      return;
    }

    try {
      logger.info(`User ${telegramUserId} setting payout address: ${payoutAddress}`);

      // Validate and set payout address via backend
      const response = await axios.put(`${config.backendUrl}/api/users/${telegramUserId}/payout-address`, {
        payoutAddress
      });

      const { user } = response.data;

      bot.sendMessage(msg.chat.id, `
✅ <b>Payout Address Updated!</b>

Your payout address has been set to:
\`${user.payoutAddress}\`

📝 <b>Important:</b>
• This address will receive all your payouts
• Make sure you control this address
• All eligible lots will be paid to this address

💰 <b>Next Steps:</b>
• Wait for your lots to mature (30 days)
• Ensure you meet referral requirement (1 user)
• Admin will process your payout manually
• You'll be notified when payout is sent

⚠️ <b>Security Reminder:</b>
Keep your private keys safe and never share them!

Use /get_payout to view your current address.
Use /balance to check your lots status.
      `, { parse_mode: 'HTML' });

    } catch (error: any) {
      logger.error('Error in setPayout command:', error);
      
      if (error.response?.data?.error === 'Invalid TRON address') {
        bot.sendMessage(msg.chat.id, `
❌ <b>Invalid TRON Address!</b>

The address you provided is not a valid TRON address.

✅ <b>Valid TRON Address Format:</b>
• Starts with 'T'
• 34 characters long
• Example: TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Please check your address and try again.
        `, { parse_mode: 'HTML' });
      } else if (error.response?.status === 404) {
        bot.sendMessage(msg.chat.id, `
❌ <b>Account not found!</b>

Please use /start to create your account first.
        `, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(msg.chat.id, '❌ Error setting payout address. Please try again later.');
      }
    }
  };
}

export default setPayoutCommand;