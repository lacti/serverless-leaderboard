export default interface UpdateRequest {
  userId: string;
  score: string;
  around: string | number;
  requestId: string;
}

export function updateRequestIdAsResultKey(updateRequestId: string): string {
  return `leaderboard:updateresponse:${updateRequestId};`;
}
