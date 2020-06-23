import CreateRankingTableSQL from "../../db/CreateRankingTableSQL";
import DeadlineTimer from "../../utils/DeadlineTimer";
import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import ResourceId from "../../models/ResourceId";
import elapsed from "../../elapsed";
import redisReleaseLock from "../../redis/redisReleaseLock";
import registerActor from "./registerActor";
import tryToAcquireLock from "./tryToAcquireLock";
import unregisterActor from "./unregisterActor";
import usePollRequests from "./usePollRequests";
import useProcessRequest from "./useProcessRequest";
import withSqliteDatabase from "../../sqlite/withSqliteDatabase";

const actorLifetime = 160 * 1000;
const emptyThresholdMillis = 5 * 1000;

async function handleWithRedis({
  redisConnection,
  resourceId,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
}): Promise<void> {
  const actorRegistered = await registerActor({
    redisConnection,
    resourceId,
    actorLifetime,
  });
  if (!actorRegistered.registered) {
    return;
  }

  const lifetimeWaiter = new DeadlineTimer(actorLifetime);
  const lockResult = await tryToAcquireLock({
    redisConnection,
    lifetimeWaiter,
    resourceId,
  });
  if (!lockResult.acquired) {
    console.error("Cannot acquire update lock");
    return;
  }

  await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    autoCommit: true,
    doIn: async ({ db }) => {
      const poll = usePollRequests({ redisConnection, resourceId });
      const process = useProcessRequest({ redisConnection, db });
      let lastProcessed = Date.now();
      while (lifetimeWaiter.alive()) {
        const requests = await poll();
        if (requests.length > 0) {
          lastProcessed = Date.now();
        } else {
          if (Date.now() - lastProcessed > emptyThresholdMillis) {
            console.info("No more job");
            break;
          }
        }
        for (const request of requests) {
          try {
            await process(request);
          } catch (error) {
            console.error(request, error);
          }
        }
      }
    },
  });

  await unregisterActor({
    redisConnection,
    resourceId,
    actorToken: actorRegistered.actorToken,
  });
  await redisReleaseLock({
    connection: redisConnection,
    resourceId,
    lockToken: lockResult.lockToken!,
  });
}

export default elapsed(handleWithRedis);
