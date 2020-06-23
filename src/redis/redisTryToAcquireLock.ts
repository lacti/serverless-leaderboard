import ResourceId, { resourceIdAsRedisLockKey } from "../models/ResourceId";

import DeadlineTimer from "../utils/DeadlineTimer";
import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import elapsed from "../elapsed";
import { nanoid } from "nanoid";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import sleep from "../utils/sleep";

async function redisTryToAcquireLock({
  connection,
  resourceId,
  expiredMillis = 30 * 1000,
  waitMillis = 20 * 5,
  sleepIntervalMillis = 20,
}: {
  connection: IRedisConnection;
  resourceId: ResourceId;
  expiredMillis?: number;
  waitMillis?: number;
  sleepIntervalMillis?: number;
}): Promise<{ lockToken?: string; acquired: boolean }> {
  const lockKey = resourceIdAsRedisLockKey(resourceId);
  const lockToken = nanoid();
  const waiter = new DeadlineTimer(waitMillis);
  while (waiter.alive()) {
    const acquired = await redisSet(connection, lockKey, lockToken, {
      expirationMillis: expiredMillis,
      onlySet: "nx",
    });
    if (acquired) {
      return { lockToken, acquired: true };
    }
    await sleep(sleepIntervalMillis);
  }
  return { acquired: false };
}

export default elapsed(redisTryToAcquireLock);
