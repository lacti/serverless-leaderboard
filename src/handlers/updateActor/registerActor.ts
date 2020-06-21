import ResourceId, {
  resourceIdAsRedisUpdateActorKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import { nanoid } from "nanoid";
import redisSet from "@yingyeothon/naive-redis/lib/set";

export default async function registerActor({
  redisConnection,
  resourceId,
  actorLifetime,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  actorLifetime: number;
}): Promise<{ registered: boolean; actorToken: string }> {
  const actorRedisKey = resourceIdAsRedisUpdateActorKey(resourceId);
  const actorToken = nanoid();
  const actorOwned = await redisSet(
    redisConnection,
    actorRedisKey,
    actorToken,
    {
      expirationMillis: actorLifetime + 1000,
      onlySet: "nx",
    }
  );
  return { registered: actorOwned, actorToken };
}
