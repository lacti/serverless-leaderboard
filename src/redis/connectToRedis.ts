import redisConnect, {
  IRedisConnection,
} from "@yingyeothon/naive-redis/lib/connection";

export default function connectToRedis(): IRedisConnection {
  return redisConnect({
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD,
    timeoutMillis: 3000,
  });
}
