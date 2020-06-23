import "../../utils/sourceMap";

import { Handler } from "aws-lambda";
import UpdateActorEvent from "../../models/UpdateActorEvent";
import elapsed from "../../elapsed/elapsed";
import flushMeasuredIntoRedis from "../../elapsed/flushMeasuredIntoRedis";
import handleWithRedis from "./handleWithRedis";
import withRedisConnection from "../../redis/withRedisConnection";

async function handleUpdateActor({
  resourceId,
}: UpdateActorEvent): Promise<void> {
  await withRedisConnection({
    doIn: async (redisConnection) =>
      handleWithRedis({ redisConnection, resourceId }),
  });
}

export const handle: Handler<UpdateActorEvent, void> = async (event) => {
  try {
    await elapsed(handleUpdateActor)(event);
  } catch (error) {
    console.error("Error in UpdateActor", event, error);
  } finally {
    await flushMeasuredIntoRedis();
  }
};
