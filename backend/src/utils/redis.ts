import { createClient } from 'redis';
import config from '../config';
import { logger } from './logger';

export async function createRedis() {
  const client = createClient({
    url: config.redisUrl,
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  await client.connect();
  return client;
}