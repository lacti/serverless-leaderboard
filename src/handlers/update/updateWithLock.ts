import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import RankResponse from "../../models/RankResponse";
import ResourceId from "../../models/ResourceId";
import UpdateRequest from "../../models/UpdateRequest";
import updateIntoDatabase from "./updateIntoDatabase";
import withRedisLock from "../../redis/withRedisLock";

export default async function updateWithLock({
  redisConnection,
  resourceId,
  request,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  request: UpdateRequest;
}): Promise<{
  executed: boolean;
  result?: RankResponse[];
}> {
  if (process.env.ACTOR_ONLY) {
    return { executed: false };
  }
  return await withRedisLock({
    connection: redisConnection,
    resourceId,
    waitMillis: 5 * 30,
    sleepIntervalMillis: 20,
    doIn: async () =>
      await updateIntoDatabase({ redisConnection, resourceId, request }),
  });
}
