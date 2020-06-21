import ResourceId, {
  resourceIdAsRedisUpdateActorKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";

export default async function unregisterActor({
  redisConnection,
  resourceId,
  actorToken,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  actorToken: string;
}): Promise<void> {
  const actorRedisKey = resourceIdAsRedisUpdateActorKey(resourceId);
  const maybeActorToken = await redisGet(redisConnection, actorRedisKey);
  if (maybeActorToken === null) {
    throw new Error(`Actor is already released [${actorToken}]`);
  }
  if (maybeActorToken !== actorToken) {
    throw new Error(
      `Actor is overwritten [${actorToken}] <> [${maybeActorToken}]`
    );
  }
  await redisDel(redisConnection, actorRedisKey);
}
