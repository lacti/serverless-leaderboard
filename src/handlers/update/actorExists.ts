import ResourceId, {
  resourceIdAsRedisUpdateActorKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../../elapsed";
import redisGet from "@yingyeothon/naive-redis/lib/get";

async function actorExists({
  redisConnection,
  resourceId,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
}): Promise<boolean> {
  const actorRedisKey = resourceIdAsRedisUpdateActorKey(resourceId);
  const maybe = await redisGet(redisConnection, actorRedisKey);
  return !!maybe;
}

export default elapsed(actorExists);
