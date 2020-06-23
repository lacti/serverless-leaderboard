import "source-map-support/register";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import ApiError from "../utils/ApiError";
import api from "../utils/api";
import elapsed from "../elapsed/elapsed";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import { resourceIdAsRedisSqliteKey } from "../models/ResourceId";
import withRedisConnection from "../redis/withRedisConnection";
import withRedisLock from "../redis/withRedisLock";

async function handleDrop(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (
    process.env.ADMIN_SECRET &&
    event.headers["x-auth"] !== process.env.ADMIN_SECRET
  ) {
    throw new ApiError(400);
  }
  const resourceId = resolveResourceIdFromEvent(event);
  await withRedisConnection({
    doIn: async (redisConnection) =>
      await withRedisLock({
        connection: redisConnection,
        resourceId,
        doIn: async () =>
          await redisDel(
            redisConnection,
            resourceIdAsRedisSqliteKey(resourceId)
          ),
      }),
  });
  return { statusCode: 200, body: "true" };
}

export const handle: APIGatewayProxyHandler = api(elapsed(handleDrop));
