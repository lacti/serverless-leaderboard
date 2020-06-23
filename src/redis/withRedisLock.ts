import elapsed from "../elapsed";
import redisReleaseLock from "./redisReleaseLock";
import redisTryToAcquireLock from "./redisTryToAcquireLock";

async function withRedisLock<R>(
  params: { doIn: () => Promise<R> } & Parameters<
    typeof redisTryToAcquireLock
  >[0] &
    Omit<Parameters<typeof redisReleaseLock>[0], "lockToken">
): Promise<{ result?: R; executed: boolean }> {
  const locked = await redisTryToAcquireLock(params);
  if (!locked.acquired) {
    return { executed: false };
  }
  try {
    const { doIn } = params;
    const result = await doIn();
    return { result, executed: true };
  } finally {
    await redisReleaseLock({ ...params, lockToken: locked.lockToken! });
  }
}

export default elapsed(withRedisLock);
