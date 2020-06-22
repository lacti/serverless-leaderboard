import * as BetterSqlite3 from "better-sqlite3";

const UpsertScoreSQL = `INSERT INTO ranking (userId, score) VALUES (@userId, @score)
ON CONFLICT(userId)
DO UPDATE SET score = excluded.score
WHERE excluded.score > ranking.score;
`;

export default function upsertScore({
  db,
  userId,
  score,
}: {
  db: BetterSqlite3.Database;
  userId: string;
  score: string | number;
}): BetterSqlite3.RunResult {
  return db.prepare(UpsertScoreSQL).run({ userId, score });
}
