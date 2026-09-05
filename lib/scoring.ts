import {AppState, TeamId} from './types';
import {TEAMS} from './data';

export type TeamScoreResult = {
  teamId: TeamId;
  name: string;
  icon: string;
  color: string;
  finished: boolean;
  finishRank: number | null;
  totalChallengesDone: number;
  basePoints: number;
  penalty: number;
  finalScore: number;
};

// Điểm về đích theo thứ tự hoàn thành hành trình.
const RANK_POINTS = [100, 80, 60, 40];

// Tính điểm chung cuộc cho tất cả các đội, dựa trên dữ liệu hiện có trong state:
// - Về đích theo thứ tự -> 100/80/60/40 điểm (đội chưa về đích: 0 điểm phần này).
// - Phạt -10 điểm nếu tổng số thử thách hoàn thành trong suốt hành trình = 0.
export function computeFinalScores(state: AppState): TeamScoreResult[] {
  const finishOrder = TEAMS
    .map(t => ({ id: t.id, at: state.teams[t.id].finishedAt }))
    .filter((x): x is { id: TeamId; at: string } => !!x.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const results: TeamScoreResult[] = TEAMS.map(t => {
    const ts = state.teams[t.id];
    const finished = !!ts.finishedAt;
    const rankIdx = finishOrder.findIndex(x => x.id === t.id);
    const finishRank = rankIdx >= 0 ? rankIdx + 1 : null;
    const basePoints = rankIdx >= 0 ? (RANK_POINTS[rankIdx] ?? 0) : 0;
    const totalChallengesDone = Object.values(ts.challengesDone)
      .reduce((sum, arr) => sum + arr.filter(Boolean).length, 0);
    const penalty = totalChallengesDone === 0 ? -10 : 0;

    return {
      teamId: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      finished,
      finishRank,
      totalChallengesDone,
      basePoints,
      penalty,
      finalScore: basePoints + penalty,
    };
  });

  return results.sort((a, b) => b.finalScore - a.finalScore);
}
