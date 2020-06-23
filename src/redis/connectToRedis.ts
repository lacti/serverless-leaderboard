import redisConnect, {
  IRedisConnection,
} from "@yingyeothon/naive-redis/lib/connection";

import { elapsedSync } from "../elapsed";

function connectToRedis(): IRedisConnection {
  return redisConnect({
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD,
    timeoutMillis: 3000,
  });
}

export default elapsedSync(connectToRedis);
