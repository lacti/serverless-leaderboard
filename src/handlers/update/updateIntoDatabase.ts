import RankResponse, { rankRecordAsResponse } from "../../models/RankResponse";

import CreateRankingTableSQL from "../../db/CreateRankingTableSQL";
import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import ResourceId from "../../models/ResourceId";
import UpdateRequest from "../../models/UpdateRequest";
import findMyNearRanking from "../../db/findMyNearRanking";
import upsertScore from "../../db/upsertScore";
import withSqliteDatabase from "../../sqlite/withSqliteDatabase";

export default async function updateIntoDatabase({
  redisConnection,
  resourceId,
  request: { userId, score, around },
}: {
  redisConnection: IRedisConnection;
  resourceId: ResourceId;
  request: UpdateRequest;
}): Promise<RankResponse[]> {
  return await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    autoCommit: true,
    doIn: async ({ db }) => {
      upsertScore({ db, userId, score });
      return rankRecordAsResponse(findMyNearRanking({ db, userId, around }));
    },
  });
}
