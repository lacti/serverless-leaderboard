import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import connectToRedis from "./connectToRedis";
import { elapsedSync } from "../elapsed";

const expirationMillis = 3 * 60 * 1000;
const connectionCache: {
  connection: IRedisConnection | null;
  expired: number;
} = {
  connection: null,
  expired: 0,
};

export function getCacheOrConnectNew(): IRedisConnection {
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

export default elapsedSync(getCacheOrConnectNew);
