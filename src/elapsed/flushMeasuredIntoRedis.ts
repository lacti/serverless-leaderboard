import { flushMeasured } from "./store";
import { getCacheOrConnectNew } from "../redis/getCacheOrConnectNew";
import redisRpush from "@yingyeothon/naive-redis/lib/rpush";

export default async function flushMeasuredIntoRedis(): Promise<void> {
  const map: { [redisKey: string]: number[] } = {};
  const tuples = flushMeasured();
  for (const tuple of tuples) {
    const redisKey = functionNameAsMeasuredRedisKey(
      tuple.functionName,
      tuple.success
    );
    if (!(redisKey in map)) {
      map[redisKey] = [tuple.elapsedMillis];
    } else {
      map[redisKey].push(tuple.elapsedMillis);
    }
  }

  try {
    await Promise.all(
      Object.entries(map).map(([redisKey, values]) =>
        redisRpush(
          getCacheOrConnectNew(),
          redisKey,
          `${values.reduce((a, b) => a + b, 0).toFixed(2)}/${values.length}`
        )
      )
    );
  } catch (error) {
    console.error("Cannot store elapsed measures into Redis", error);
  }
}

function functionNameAsMeasuredRedisKey(
  functionName: string,
  success: boolean
) {
  return `leaderboard:measure:${
    success ? "success" : "failed"
  }:${functionName}`;
}
