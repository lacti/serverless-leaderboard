import "source-map-support/register";

import { APIGatewayProxyHandler } from "aws-lambda";
import CreateRankingTableSQL from "../db/CreateRankingTableSQL";
import fetchRanking from "../db/fetchRanking";
import { rankRecordAsResponse } from "../models/RankResponse";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import withRedisConnection from "../redis/withRedisConnection";
import withSqliteDatabase from "../sqlite/withSqliteDatabase";

export const handle: APIGatewayProxyHandler = async (event) => {
  const resourceId = resolveResourceIdFromEvent(event);
  const { offset = "0", limit = "10" } = event.queryStringParameters ?? {};
  const records = await withRedisConnection({
    doIn: async (redisConnection) =>
      await withSqliteDatabase({
        connection: redisConnection,
        resourceId,
        createTableQuery: CreateRankingTableSQL,
        doIn: async ({ db }) =>
          rankRecordAsResponse(fetchRanking({ db, offset, limit })),
      }),
  });
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
};
