import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../../elapsed/elapsed";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import { updateRequestIdAsResultKey } from "../../models/UpdateRequest";

async function retrieveUpdateResult({
  redisConnection,
  requestId,
}: {
  redisConnection: IRedisConnection;
  requestId: string;
}): Promise<string | null> {
  const updateResultKey = updateRequestIdAsResultKey(requestId);
  const result = await redisGet(redisConnection, updateResultKey);
  if (result === null) {
    return null;
  }
  await redisDel(redisConnection, updateResultKey);
  return result;
}

export default elapsed(retrieveUpdateResult);
