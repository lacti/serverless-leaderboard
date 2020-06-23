import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../elapsed";
import getCacheOrConnectNew from "./getCacheOrConnectNew";

async function withRedisConnection<R>({
  doIn,
}: {
  doIn: (redisConnection: IRedisConnection) => Promise<R>;
}): Promise<R> {
  return await doIn(getCacheOrConnectNew());
}

export default elapsed(withRedisConnection);
