import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import getCacheOrConnectNew from "./getCacheOrConnectNew";

export default async function withRedisConnection<R>({
  doIn,
}: {
  doIn: (redisConnection: IRedisConnection) => Promise<R>;
}): Promise<R> {
  return await doIn(getCacheOrConnectNew());
}
