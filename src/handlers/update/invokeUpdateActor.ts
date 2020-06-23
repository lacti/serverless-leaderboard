import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import { Lambda } from "aws-sdk";
import ResourceId from "../../models/ResourceId";
import elapsed from "../../elapsed/elapsed";
import isActorInvokable from "./isActorInvokable";
import sleep from "../../utils/sleep";

const lambdaColdStartMillis = 200;

async function invokeUpdateActor({
  redisConnection,
  resourceId,
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
}): Promise<void> {
  try {
    if (!(await isActorInvokable({ redisConnection, resourceId }))) {
      return;
    }
    const invoked = await new Lambda({
      endpoint: process.env.IS_OFFLINE ? `http://localhost:3002` : undefined,
    })
      .invoke({
        FunctionName: process.env.UPDATE_ACTOR_FUNCTION_NAME!,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify({ resourceId }),
      })
      .promise();
    await sleep(lambdaColdStartMillis);
    console.info("Lambda invoked", resourceId, invoked);
  } catch (error) {
    console.error("Lambda invocation error", resourceId, error);
  }
}

export default elapsed(invokeUpdateActor);
