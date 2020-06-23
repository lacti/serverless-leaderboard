import DeadlineTimer from "../../utils/DeadlineTimer";
import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import ResourceId from "../../models/ResourceId";
import UpdateRequest from "../../models/UpdateRequest";
import actorExists from "./actorExists";
import elapsed from "../../elapsed";
import invokeUpdateActor from "./invokeUpdateActor";
import retrieveUpdateResult from "./retrieveUpdateResult";

async function pollUpdateResult({
  redisConnection,
  resourceId,
  request,
  deadlineMillis = 500,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  request: UpdateRequest;
  deadlineMillis?: number;
}): Promise<string | null> {
  if (!(await actorExists({ redisConnection, resourceId }))) {
    await invokeUpdateActor({ redisConnection, resourceId });
  }
  return await new DeadlineTimer(deadlineMillis).aliveDo({
    sleepMillis: 25,
    doIn: async () =>
      await retrieveUpdateResult({
        redisConnection,
        requestId: request.requestId,
      }),
  });
}

export default elapsed(pollUpdateResult);
