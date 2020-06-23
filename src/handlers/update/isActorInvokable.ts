import ResourceId, {
  resourceIdAsRedisUpdateActorInvocationKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../../elapsed";
import redisSet from "@yingyeothon/naive-redis/lib/set";

async function isActorInvokable({
  redisConnection,
  resourceId,
  intervalMillis = 2000,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  intervalMillis?: number;
}): Promise<boolean> {
  const invocationRedisKey = resourceIdAsRedisUpdateActorInvocationKey(
    resourceId
  );
  return await redisSet(
    redisConnection,
    invocationRedisKey,
    Date.now().toString(),
    {
      expirationMillis: intervalMillis,
      onlySet: "nx",
    }
  );
}

export default elapsed(isActorInvokable);
