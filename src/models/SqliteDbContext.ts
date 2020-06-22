import * as BetterSqlite3 from "better-sqlite3";

export default interface SqliteDbContext {
  db: BetterSqlite3.Database;
  localDbFile: string;
}
