import ResourceId, {
  resourceIdAsUpdateActorQueueKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import UpdateRequest from "../../models/UpdateRequest";
import elapsed from "../../elapsed/elapsed";
import redisLrange from "@yingyeothon/naive-redis/lib/lrange";
import redisLtrim from "@yingyeothon/naive-redis/lib/ltrim";

export default function usePollRequests({
  redisConnection,
  resourceId,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
}): () => Promise<UpdateRequest[]> {
  const actorQueueRedisKey = resourceIdAsUpdateActorQueueKey(resourceId);
  async function pollRequests(): Promise<UpdateRequest[]> {
    const requestStrings: string[] = await redisLrange(
      redisConnection,
      actorQueueRedisKey,
      0,
      -1
    );
    if (requestStrings?.length > 0) {
      await redisLtrim(
        redisConnection,
        actorQueueRedisKey,
        requestStrings.length,
        -1
      );
    }
    return requestStrings.map((each) => JSON.parse(each) as UpdateRequest);
  }
  return elapsed(pollRequests);
}
