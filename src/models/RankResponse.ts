import RankRecord from "./RankRecord";

export default interface RankResponse {
  rank: number;
  user: string;
  score: number;
}

export function rankRecordAsResponse(records: RankRecord[]): RankResponse[] {
  return records.map(({ rankNo, userId, score }) => ({
    rank: rankNo,
    user: userId,
    score,
  }));
}
