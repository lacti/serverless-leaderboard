import UpdateRequest, {
  updateRequestIdAsResultKey,
} from "../../models/UpdateRequest";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import SqliteDbContext from "../../models/SqliteDbContext";
import elapsed from "../../elapsed/elapsed";
import findMyNearRanking from "../../db/findMyNearRanking";
import { rankRecordAsResponse } from "../../models/RankResponse";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import upsertScore from "../../db/upsertScore";

export default function useProcessRequest({
  redisConnection,
  db,
}: Pick<SqliteDbContext, "db"> & {
  redisConnection: IRedisConnection;
}): (request: UpdateRequest) => Promise<void> {
  async function processRequest(request: UpdateRequest): Promise<void> {
    upsertScore({ db, userId: request.userId, score: request.score });
    const records = rankRecordAsResponse(
      findMyNearRanking({
        db,
        userId: request.userId,
        around: request.around,
      })
    );
    await redisSet(
      redisConnection,
      updateRequestIdAsResultKey(request.requestId),
      JSON.stringify(records),
      {
        expirationMillis: 5000,
      }
    );
  }
  return elapsed(processRequest);
}
