import "source-map-support/register";

import * as BetterSqlite3 from "better-sqlite3";
import * as fs from "fs";

import redisConnect, {
  IRedisConnection,
} from "@yingyeothon/naive-redis/lib/connection";

import { APIGatewayProxyHandler } from "aws-lambda";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import tempy from "tempy";
import { v4 as uuidv4 } from "uuid";

import Database = require("better-sqlite3");

const CreateRankingTableSQL = `CREATE TABLE ranking (userId TEXT PRIMARY KEY, score INTEGER);`;
const FetchRankingSQL = `WITH rankNoView AS (
  SELECT RANK() OVER (ORDER BY score DESC) AS rankNo
       , userId
       , score
  FROM ranking
)
SELECT * FROM rankNoView ORDER BY rankNo LIMIT @limit OFFSET @offset`;
function fetchRanking({
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

const FindMyRankingSQL = `WITH rankNoView AS (
  SELECT RANK() OVER (ORDER BY Score DESC) AS rankNo
       , userId
       , score
  FROM ranking
)
SELECT *
FROM rankNoView
WHERE userId = @userId`;
function findMyRank({
  db,
  userId,
}: {
  db: BetterSqlite3.Database;
  userId: string;
}): RankRecord | undefined {
  return (db.prepare(FindMyRankingSQL).all({ userId }) as RankRecord[])[0];
}

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
function findMyNearRanking({
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

const UpsertScoreSQL = `INSERT INTO ranking (userId, score) VALUES (@userId, @score)
ON CONFLICT(userId)
DO UPDATE SET score = excluded.score
WHERE excluded.score > ranking.score;
`;
function upsertScore({
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

const redisConnection = redisConnect({
  host: process.env.REDIS_HOST!,
  password: process.env.REDIS_PASSWORD,
});

export const update: APIGatewayProxyHandler = async (event) => {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }
  const resourceId = `${serviceId}/${period}`;

  const userId = event.headers["x-user"];
  const score = event.body!;
  if (!userId || !score) {
    return { statusCode: 400, body: "" };
  }
  const { around = "10" } = event.queryStringParameters ?? {};
  const records = await withRedisLock({
    connection: redisConnection,
    resourceId,
    doIn: async () => {
      return await withSqliteDatabase({
        connection: redisConnection,
        resourceId,
        createTableQuery: CreateRankingTableSQL,
        doIn: async ({ db, localDbFile }) => {
          upsertScore({ db, userId, score });
          await storeSqliteDatabase({
            connection: redisConnection,
            resourceId,
            localDbFile,
          });
          return rankRecordAsResponse(
            findMyNearRanking({ db, userId, around })
          );
        },
      });
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
};

export const getAll: APIGatewayProxyHandler = async (event) => {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }
  const resourceId = `${serviceId}/${period}`;

  const userId = event.headers["x-user"];
  const { offset = "0", limit = "10", around = "10" } =
    event.queryStringParameters ?? {};
  const result = await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    doIn: async ({ db }) => {
      const topRanks = rankRecordAsResponse(
        fetchRanking({ db, offset, limit })
      );
      const aroundRanks = userId
        ? rankRecordAsResponse(findMyNearRanking({ db, userId, around }))
        : undefined;
      const myRank =
        userId && aroundRanks
          ? aroundRanks.find((record) => record.user === userId)
          : undefined;
      return { top: topRanks, around: aroundRanks, my: myRank };
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

export const top: APIGatewayProxyHandler = async (event) => {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }
  const resourceId = `${serviceId}/${period}`;

  const { offset = "0", limit = "10" } = event.queryStringParameters ?? {};
  const records = await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    doIn: async ({ db }) => {
      return rankRecordAsResponse(fetchRanking({ db, offset, limit }));
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
};

export const me: APIGatewayProxyHandler = async (event) => {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }
  const resourceId = `${serviceId}/${period}`;

  const userId = event.headers["x-user"];
  if (!userId) {
    return { statusCode: 400, body: "" };
  }
  const myRank = await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    doIn: async ({ db }) => {
      const result = findMyRank({ db, userId });
      return result ? rankRecordAsResponse([result])[0] : result;
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(myRank ?? null),
  };
};

export const around: APIGatewayProxyHandler = async (event) => {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }

  const resourceId = `${serviceId}/${period}`;
  const userId = event.headers["x-user"];
  if (!userId) {
    return { statusCode: 400, body: "" };
  }
  const { around = "10" } = event.queryStringParameters ?? {};
  const records = await withSqliteDatabase({
    connection: redisConnection,
    resourceId,
    createTableQuery: CreateRankingTableSQL,
    doIn: async ({ db }) => {
      return rankRecordAsResponse(findMyNearRanking({ db, userId, around }));
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
};

export const drop: APIGatewayProxyHandler = async (event) => {
  if (
    process.env.ADMIN_SECRET &&
    event.headers["x-auth"] !== process.env.ADMIN_SECRET
  ) {
    return { statusCode: 400, body: "" };
  }
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    return { statusCode: 400, body: "" };
  }
  const resourceId = `${serviceId}/${period}`;
  await withRedisLock({
    connection: redisConnection,
    resourceId,
    doIn: async () => {
      redisDel(redisConnection, resourceIdAsRedisSqliteKey(resourceId));
    },
  });
  return { statusCode: 200, body: "true" };
};

function rankRecordAsResponse(records: RankRecord[]): RankResponse[] {
  return records.map(({ rankNo, userId, score }) => ({
    rank: rankNo,
    user: userId,
    score,
  }));
}

function sleep(millis: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, millis));
}

function resourceIdAsRedisLockKey(resourceId: string) {
  return `leaderboard:lock:${resourceId}`;
}

async function redisAcquireLock({
  connection,
  resourceId,
  expiredMillis = 30 * 1000,
  waitMillis = 5 * 1000,
  sleepIntervalMillis = 10,
}: {
  connection: IRedisConnection;
  resourceId: string;
  expiredMillis?: number;
  waitMillis?: number;
  sleepIntervalMillis?: number;
}): Promise<string> {
  const lockKey = resourceIdAsRedisLockKey(resourceId);
  const token = uuidv4();
  const start = Date.now();
  while (Date.now() - start <= waitMillis) {
    const acquired = await redisSet(connection, lockKey, token, {
      expirationMillis: expiredMillis,
      onlySet: "nx",
    });
    if (acquired) {
      return token;
    }
    await sleep(sleepIntervalMillis);
  }
  throw new Error(`Cannot acquire lock for ${resourceId}`);
}

async function redisReleaseLock({
  connection,
  resourceId,
  lockToken,
}: {
  connection: IRedisConnection;
  resourceId: string;
  lockToken: string;
}): Promise<void> {
  const lockKey = resourceIdAsRedisLockKey(resourceId);
  const token = await redisGet(connection, lockKey);
  if (token !== lockToken) {
    throw new Error(`Invalid lock token: [${lockToken}] <> [${token}]`);
  }
  await redisDel(connection, lockKey);
}

async function withRedisLock<R>(
  params: { doIn: () => Promise<R> } & Parameters<typeof redisAcquireLock>[0] &
    Omit<Parameters<typeof redisReleaseLock>[0], "lockToken">
): Promise<R> {
  const lockToken = await redisAcquireLock(params);
  try {
    const { doIn } = params;
    const result = await doIn();
    return result;
  } finally {
    await redisReleaseLock({ ...params, lockToken });
  }
}

interface SqliteDbContext {
  db: BetterSqlite3.Database;
  localDbFile: string;
}

interface RankRecord {
  rankNo: number;
  userId: string;
  score: number;
}

interface RankResponse {
  rank: number;
  user: string;
  score: number;
}

function resourceIdAsRedisSqliteKey(resourceId: string) {
  return `leaderboard:sqlite:${resourceId}.db`;
}

async function getSqliteDatabase({
  connection,
  resourceId,
  createTableQuery,
}: {
  connection: IRedisConnection;
  resourceId: string;
  createTableQuery: string;
}): Promise<SqliteDbContext> {
  const sqliteKey = resourceIdAsRedisSqliteKey(resourceId);
  const sqliteBase64 = await redisGet(connection, sqliteKey);
  const localDbFile = tempy.file({ extension: ".db" });
  if (sqliteBase64 !== null) {
    fs.writeFileSync(localDbFile, Buffer.from(sqliteBase64, "base64"));
  }

  const db = new Database(localDbFile, { verbose: console.log });
  if (sqliteBase64 === null) {
    db.prepare(createTableQuery).run();
  }
  return { db, localDbFile };
}

function closeSqliteDatabase({ db, localDbFile }: SqliteDbContext) {
  db.close();
  fs.unlinkSync(localDbFile);
}

async function withSqliteDatabase<R>(
  params: {
    doIn: (params: SqliteDbContext) => Promise<R>;
  } & Parameters<typeof getSqliteDatabase>[0]
): Promise<R> {
  const dbContext = await getSqliteDatabase(params);
  try {
    const { doIn } = params;
    const result = await doIn(dbContext);
    return result;
  } finally {
    closeSqliteDatabase(dbContext);
  }
}

async function storeSqliteDatabase({
  connection,
  resourceId,
  localDbFile,
}: {
  connection: IRedisConnection;
  resourceId: string;
  localDbFile: string;
}): Promise<void> {
  if (!fs.existsSync(localDbFile) || fs.lstatSync(localDbFile).size === 0) {
    return;
  }
  const sqliteKey = resourceIdAsRedisSqliteKey(resourceId);
  const sqliteBase64 = fs.readFileSync(localDbFile).toString("base64");
  await redisSet(connection, sqliteKey, sqliteBase64);
}
