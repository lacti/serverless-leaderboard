import * as BetterSqlite3 from "better-sqlite3";

import RankRecord from "../models/RankRecord";

const FindMyRankingSQL = `WITH rankNoView AS (
  SELECT RANK() OVER (ORDER BY Score DESC) AS rankNo
       , userId
       , score
  FROM ranking
)
SELECT *
FROM rankNoView
WHERE userId = @userId`;

export default function findMyRank({
  db,
  userId,
}: {
  db: BetterSqlite3.Database;
  userId: string;
}): RankRecord | undefined {
  return (db.prepare(FindMyRankingSQL).all({ userId }) as RankRecord[])[0];
}
