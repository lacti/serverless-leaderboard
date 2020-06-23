import * as fs from "fs";

import ResourceId, { resourceIdAsRedisSqliteKey } from "../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import SqliteDbContext from "../models/SqliteDbContext";
import elapsed from "../elapsed/elapsed";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import tempy from "tempy";

import Database = require("better-sqlite3");

async function getSqliteDatabase({
  connection,
  resourceId,
  createTableQuery,
}: {
  connection: IRedisConnection;
  resourceId: ResourceId;
  createTableQuery: string;
}): Promise<SqliteDbContext> {
  const sqliteKey = resourceIdAsRedisSqliteKey(resourceId);
  const sqliteBase64 = await redisGet(connection, sqliteKey);
  const localDbFile = tempy.file({ extension: ".db" });
  if (sqliteBase64 !== null) {
    fs.writeFileSync(localDbFile, Buffer.from(sqliteBase64, "base64"));
  }

  const db = new Database(localDbFile, {
    verbose: process.env.DEBUG ? console.log : undefined,
  });
  if (sqliteBase64 === null) {
    db.prepare(createTableQuery).run();
  }
  return { db, localDbFile };
}

export default elapsed(getSqliteDatabase);
