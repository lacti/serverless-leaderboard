import ResourceId, { resourceIdAsRedisLockKey } from "../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../elapsed";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";

async function redisReleaseLock({
  connection,
  resourceId,
  lockToken,
}: {
  connection: IRedisConnection;
  resourceId: ResourceId;
  lockToken: string;
}): Promise<void> {
  const lockKey = resourceIdAsRedisLockKey(resourceId);
  const currentLockToken = await redisGet(connection, lockKey);
  if (currentLockToken === null) {
    throw new Error(`Lock is already released: [${lockToken}]`);
  }
  if (currentLockToken !== lockToken) {
    throw new Error(
      `Invalid lock token: [${lockToken}] <> [${currentLockToken}]`
    );
  }
  await redisDel(connection, lockKey);
}

export default elapsed(redisReleaseLock);
