import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import connectToRedis from "./connectToRedis";

const expirationMillis = 3 * 60 * 1000;
const connectionCache: {
  connection: IRedisConnection | null;
  expired: number;
} = {
  connection: null,
  expired: 0,
};

export default function getCacheOrConnectNew(): IRedisConnection {
  if (
    connectionCache.connection !== null &&
    connectionCache.expired > Date.now()
  ) {
    return connectionCache.connection;
  }
  if (connectionCache.connection !== null) {
    connectionCache.connection.socket.disconnect();
  }

  connectionCache.connection = connectToRedis();
  connectionCache.expired = Date.now() + expirationMillis;
  return connectionCache.connection;
}
