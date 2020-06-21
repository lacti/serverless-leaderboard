import ResourceId, {
  resourceIdAsUpdateActorQueueKey,
} from "../../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import UpdateRequest from "../../models/UpdateRequest";
import redisRpush from "@yingyeothon/naive-redis/lib/rpush";

export default async function enqueueRequest({
  redisConnection,
  resourceId,
  request,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  request: UpdateRequest;
}): Promise<void> {
  const actorQueueKey = resourceIdAsUpdateActorQueueKey(resourceId);
  const enqueued = await redisRpush(
    redisConnection,
    actorQueueKey,
    JSON.stringify(request)
  );
  console.info("Count of enqueued requests", enqueued);
}
