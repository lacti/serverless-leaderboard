export default interface ResourceId {
  serviceId: string;
  period: string;
}

export function resourceIdAsUpdateActorQueueKey(
  resourceId: ResourceId
): string {
  return `leaderboard:updateactorqueue:${resourceId}`;
}

export function resourceIdAsString({ serviceId, period }: ResourceId): string {
  return `${serviceId}/${period}`;
}

export function resourceIdAsRedisUpdateActorKey(
  resourceId: ResourceId
): string {
  return `leaderboard:updateactor:${resourceIdAsString(resourceId)}`;
}

export function resourceIdAsRedisLockKey(resourceId: ResourceId): string {
  return `leaderboard:lock:${resourceIdAsString(resourceId)}`;
}

export function resourceIdAsRedisSqliteKey(resourceId: ResourceId): string {
  return `leaderboard:sqlite:${resourceIdAsString(resourceId)}.db`;
}

export function resourceIdAsRedisUpdateActorInvocationKey(
  resourceId: ResourceId
): string {
  return `leaderboard:updateactor-invoke:${resourceIdAsString(resourceId)}`;
}
