import * as fs from "fs";

import ResourceId, { resourceIdAsRedisSqliteKey } from "../models/ResourceId";

import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisSet from "@yingyeothon/naive-redis/lib/set";

export default async function storeSqliteDatabase({
  connection,
  resourceId,
  localDbFile,
}: {
  connection: IRedisConnection;
  resourceId: ResourceId;
  localDbFile: string;
}): Promise<void> {
  if (!fs.existsSync(localDbFile) || fs.lstatSync(localDbFile).size === 0) {
    return;
  }
  const sqliteKey = resourceIdAsRedisSqliteKey(resourceId);
  const sqliteBase64 = fs.readFileSync(localDbFile).toString("base64");

  await redisSet(connection, sqliteKey, sqliteBase64);
}
