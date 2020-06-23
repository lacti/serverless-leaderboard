import "../../utils/sourceMap";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import DeadlineTimer from "../../utils/DeadlineTimer";
import UpdateRequest from "../../models/UpdateRequest";
import actorExists from "./actorExists";
import api from "../../utils/api";
import elapsed from "../../elapsed";
import enqueueRequest from "./enqueueRequest";
import { nanoid } from "nanoid";
import pollUpdateResult from "./pollUpdateResult";
import resolveResourceIdFromEvent from "../../utils/resolveResourceIdFromEvent";
import throwError from "../../utils/throwError";
import updateWithLock from "./updateWithLock";
import withRedisConnection from "../../redis/withRedisConnection";

const deadlineMillisForWaitingResult = 3 * 1000;

async function handleUpdate(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const resourceId = resolveResourceIdFromEvent(event);
  const userId = event.headers["x-user"] ?? throwError(400)();
  const score = event.body ?? throwError(400)();
  const { around = "10" } = event.queryStringParameters ?? {};

  const request: UpdateRequest = {
    userId,
    score,
    around,
    requestId: nanoid(),
  };

  return await withRedisConnection({
    doIn: async (redisConnection) => {
      if (!(await actorExists({ redisConnection, resourceId }))) {
        console.info("Try with locking");
        const lockedExecution = await updateWithLock({
          redisConnection,
          resourceId,
          request,
        });
        if (lockedExecution.executed) {
          return {
            statusCode: 200,
            body: JSON.stringify(lockedExecution.result!),
          };
        }
      }

      await enqueueRequest({ redisConnection, resourceId, request });

      const result =
        (await new DeadlineTimer(deadlineMillisForWaitingResult).aliveDo({
          sleepMillis: 10,
          doIn: async () =>
            await pollUpdateResult({ redisConnection, resourceId, request }),
        })) ?? throwError(500, "Timeout")();
      return { statusCode: 200, body: result };
    },
  });
}

export const handle: APIGatewayProxyHandler = api(elapsed(handleUpdate));
