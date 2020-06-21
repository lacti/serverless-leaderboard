import "source-map-support/register";

import { APIGatewayProxyHandler } from "aws-lambda";
import ApiError from "../utils/ApiError";
import CreateRankingTableSQL from "../db/CreateRankingTableSQL";
import api from "../utils/api";
import findMyNearRanking from "../db/findMyNearRanking";
import { rankRecordAsResponse } from "../models/RankResponse";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import withRedisConnection from "../redis/withRedisConnection";
import withSqliteDatabase from "../sqlite/withSqliteDatabase";

export const handle: APIGatewayProxyHandler = api(async (event) => {
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
});
