import "source-map-support/register";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import CreateRankingTableSQL from "../db/CreateRankingTableSQL";
import elapsed from "../elapsed/elapsed";
import fetchRanking from "../db/fetchRanking";
import { rankRecordAsResponse } from "../models/RankResponse";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import withRedisConnection from "../redis/withRedisConnection";
import withSqliteDatabase from "../sqlite/withSqliteDatabase";

async function handleTop(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
}

export const handle: APIGatewayProxyHandler = elapsed(handleTop);
