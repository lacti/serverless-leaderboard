import * as BetterSqlite3 from "better-sqlite3";

import RankRecord from "../models/RankRecord";

const FindMyNearRankingSQL = `WITH rankNoView AS (
  SELECT RANK() OVER (ORDER BY Score DESC) AS rankNo
       , userId
       , score
  FROM ranking
),
myRankNoView AS (
  SELECT rankNo AS myRankNo
  FROM rankNoView
  WHERE userId = @userId
)
SELECT *
FROM rankNoView r
  JOIN myRankNoView m ON r.rankNo BETWEEN m.myRankNo - @around AND m.myRankNo + @around
ORDER BY rankNo`;

export default function findMyNearRanking({
  db,
  userId,
  around,
}: {
  db: BetterSqlite3.Database;
  userId: string;
  around: number | string;
}): RankRecord[] {
  return db
    .prepare(FindMyNearRankingSQL)
    .all({ userId, around }) as RankRecord[];
}
