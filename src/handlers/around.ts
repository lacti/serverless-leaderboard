import "../utils/sourceMap";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import ApiError from "../utils/ApiError";
import CreateRankingTableSQL from "../db/CreateRankingTableSQL";
import api from "../utils/api";
import elapsed from "../elapsed";
import findMyNearRanking from "../db/findMyNearRanking";
import { rankRecordAsResponse } from "../models/RankResponse";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import withRedisConnection from "../redis/withRedisConnection";
import withSqliteDatabase from "../sqlite/withSqliteDatabase";

async function handleAround(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const resourceId = resolveResourceIdFromEvent(event);
  const userId = event.headers["x-user"];
  if (!userId) {
    throw new ApiError(400);
  }
  const { around = "10" } = event.queryStringParameters ?? {};
  const records = await withRedisConnection({
    doIn: async (redisConnection) =>
      await withSqliteDatabase({
        connection: redisConnection,
        resourceId,
        createTableQuery: CreateRankingTableSQL,
        doIn: async ({ db }) =>
          rankRecordAsResponse(findMyNearRanking({ db, userId, around })),
      }),
  });
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
}

export const handle: APIGatewayProxyHandler = api(elapsed(handleAround));
