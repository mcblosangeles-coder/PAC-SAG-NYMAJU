import { createClient, type RedisClientType } from "redis";
import { env } from "./env";
import { logger } from "./logger";

let client: RedisClientType | null = null;
let connectingPromise: Promise<RedisClientType> | null = null;

const getClient = (): RedisClientType => {
  if (!client) {
    client = createClient({
      url: env.redisUrl
    });
    client.on("error", (error) => {
      logger.error("db.redis.error", "Redis client error.", error);
    });
  }

  return client;
};

export const connectRedis = async (): Promise<RedisClientType> => {
  const redisClient = getClient();
  if (redisClient.isOpen) return redisClient;
  if (connectingPromise) return connectingPromise;

  connectingPromise = redisClient.connect().then(() => redisClient);
  try {
    return await connectingPromise;
  } finally {
    connectingPromise = null;
  }
};

export const getRedisClientOrNull = (): RedisClientType | null => {
  if (!client || !client.isOpen) return null;
  return client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (!client) return;
  if (client.isOpen) {
    await client.quit();
  }
  client = null;
};

export const assertRedisConnectivity = async (): Promise<void> => {
  const redisClient = await connectRedis();
  const pong = await redisClient.ping();
  if (pong !== "PONG") {
    throw new Error("Redis ping failed.");
  }
};
