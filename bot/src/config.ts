import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Validate required config
  validate() {
    if (!this.telegramBotToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    if (!this.telegramBotUsername) {
      throw new Error('TELEGRAM_BOT_USERNAME is required');
    }
  }
};

config.validate();