import "../utils/sourceMap";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import CreateRankingTableSQL from "../db/CreateRankingTableSQL";
import api from "../utils/api";
import elapsed from "../elapsed";
import findMyRank from "../db/findMyRank";
import { rankRecordAsResponse } from "../models/RankResponse";
import resolveResourceIdFromEvent from "../utils/resolveResourceIdFromEvent";
import throwError from "../utils/throwError";
import withRedisConnection from "../redis/withRedisConnection";
import withSqliteDatabase from "../sqlite/withSqliteDatabase";

async function handleMe(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const resourceId = resolveResourceIdFromEvent(event);
  const userId = event.headers["x-user"] ?? throwError(400)();
  const myRank = await withRedisConnection({
    doIn: async (redisConnection) =>
      await withSqliteDatabase({
        connection: redisConnection,
        resourceId,
        createTableQuery: CreateRankingTableSQL,
        doIn: async ({ db }) => {
          const result = findMyRank({ db, userId });
          return result ? rankRecordAsResponse([result])[0] : undefined;
        },
      }),
  });
  return {
    statusCode: 200,
    body: JSON.stringify(myRank ?? null),
  };
}

export const handle: APIGatewayProxyHandler = api(elapsed(handleMe));
