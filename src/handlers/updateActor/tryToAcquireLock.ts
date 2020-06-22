import DeadlineTimer from "../../utils/DeadlineTimer";
import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import ResourceId from "../../models/ResourceId";
import redisTryToAcquireLock from "../../redis/redisTryToAcquireLock";

export default async function tryToAcquireLock({
  redisConnection,
  lifetimeWaiter,
  resourceId,
}: {
  redisConnection: IRedisConnection;
  lifetimeWaiter: DeadlineTimer;
  resourceId: ResourceId;
}): ReturnType<typeof redisTryToAcquireLock> {
  while (lifetimeWaiter.alive()) {
    const lockAcquired = await redisTryToAcquireLock({
      connection: redisConnection,
      resourceId,
      expiredMillis: lifetimeWaiter.remaining() + 1000,
      waitMillis: 1000,
      sleepIntervalMillis: 20,
    });
    if (lockAcquired.acquired) {
      return lockAcquired;
    }
  }
  return { acquired: false };
}
