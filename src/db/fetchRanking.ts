import * as BetterSqlite3 from "better-sqlite3";

import RankRecord from "../models/RankRecord";

const FetchRankingSQL = `WITH rankNoView AS (
  SELECT RANK() OVER (ORDER BY score DESC) AS rankNo
       , userId
       , score
  FROM ranking
)
SELECT * FROM rankNoView ORDER BY rankNo LIMIT @limit OFFSET @offset`;

export default function fetchRanking({
  db,
  limit,
  offset,
}: {
  db: BetterSqlite3.Database;
  limit: string | number;
  offset: string | number;
}): RankRecord[] {
  return db.prepare(FetchRankingSQL).all({ limit, offset }) as RankRecord[];
}
