import SqliteDbContext from "../models/SqliteDbContext";
import closeSqliteDatabase from "./closeSqliteDatabase";
import elapsed from "../elapsed/elapsed";
import getSqliteDatabase from "./getSqliteDatabase";
import storeSqliteDatabase from "./storeSqliteDatabase";

async function withSqliteDatabase<R>(
  params: {
    doIn: (params: SqliteDbContext) => Promise<R>;
    autoCommit?: boolean;
  } & Parameters<typeof getSqliteDatabase>[0]
): Promise<R> {
  const dbContext = await getSqliteDatabase(params);
  try {
    const { doIn } = params;
    const result = await doIn(dbContext);
    return result;
  } finally {
    const { autoCommit } = params;
    if (autoCommit) {
      await storeSqliteDatabase({
        connection: params.connection,
        resourceId: params.resourceId,
        localDbFile: dbContext.localDbFile,
      });
    }
    closeSqliteDatabase(dbContext);
  }
}

export default elapsed(withSqliteDatabase);
