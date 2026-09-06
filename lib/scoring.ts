import { CHECKPOINTS, TEAMS } from './data';
import type { AppState, TeamId, TeamScoreResult } from './types';

export function computeFinalScores(
  state: AppState
): TeamScoreResult[] {

  // ============================================================
  // 1. XÁC ĐỊNH THỨ HẠNG VỀ ĐÍCH
  // ============================================================

  const finished = TEAMS
    .map(team => ({
      team,
      state: state.teams[team.id],
    }))
    .filter(item => !!item.state.finishedAt)
    .sort((a, b) => {
      const timeA = new Date(
        a.state.finishedAt!
      ).getTime();

      const timeB = new Date(
        b.state.finishedAt!
      ).getTime();

      return timeA - timeB;
    });

  const rankByTeam = new Map<TeamId, number>();

  finished.forEach((item, index) => {
    rankByTeam.set(
      item.team.id,
      index + 1
    );
  });

  // ============================================================
  // 2. ĐIỂM THEO THỨ HẠNG
  // ============================================================

  const pointsByRank: Record<number, number> = {
    1: 100,
    2: 80,
    3: 60,
    4: 40,
  };

  // ============================================================
  // 3. TỔNG SỐ THỬ THÁCH
  // ============================================================

  const totalChallenges = CHECKPOINTS.reduce(
    (total, checkpoint) => {
      return total + checkpoint.challenges;
    },
    0
  );

  // ============================================================
  // 4. TÍNH ĐIỂM TỪNG ĐỘI
  // ============================================================

  const results: TeamScoreResult[] =
    TEAMS.map(team => {

      const teamState =
        state.teams[team.id];

      // --------------------------------------------------------
      // Đếm chính xác số thử thách đã hoàn thành
      // dựa trên cấu hình CHECKPOINTS
      // --------------------------------------------------------

      const totalChallengesDone =
        CHECKPOINTS.reduce(
          (total, checkpoint) => {

            const challengeArray =
              teamState.challengesDone?.[
                checkpoint.id
              ] ?? [];

            const completed =
              challengeArray
                .slice(0, checkpoint.challenges)
                .filter(Boolean)
                .length;

            return total + completed;
          },
          0
        );

      // --------------------------------------------------------
      // Số thử thách chưa hoàn thành
      // --------------------------------------------------------

      const totalChallengesNotDone =
        Math.max(
          0,
          totalChallenges -
            totalChallengesDone
        );

      // --------------------------------------------------------
      // Thứ hạng về đích
      // --------------------------------------------------------

      const finishRank =
        rankByTeam.get(team.id) ?? null;

      // --------------------------------------------------------
      // Điểm cơ bản
      // --------------------------------------------------------

      const basePoints =
        finishRank !== null
          ? pointsByRank[finishRank] ?? 0
          : 0;

      // --------------------------------------------------------
      // ĐIỂM PHẠT
      //
      // Mỗi thử thách không hoàn thành = -10 điểm
      // --------------------------------------------------------

      const penalty =
        totalChallengesNotDone * -10;

      // --------------------------------------------------------
      // ĐIỂM CUỐI CÙNG
      // --------------------------------------------------------

      const finalScore =
        basePoints + penalty;

      return {
        teamId: team.id,
        name: team.name,
        color: team.color,
        icon: team.icon,

        finished:
          !!teamState.finishedAt,

        finishRank,

        basePoints,

        totalChallenges,

        totalChallengesDone,

        totalChallengesNotDone,

        penalty,

        finalScore,
      };
    });

  // ============================================================
  // 5. SẮP XẾP KẾT QUẢ
  // ============================================================

  return results.sort((a, b) => {

    // Đội đã về đích đứng trước
    if (a.finished !== b.finished) {
      return a.finished ? -1 : 1;
    }

    // Các đội đã về đích:
    // ưu tiên thứ hạng về đích
    if (
      a.finished &&
      b.finished &&
      a.finishRank !== null &&
      b.finishRank !== null
    ) {
      return (
        a.finishRank -
        b.finishRank
      );
    }

    return 0;
  });
}
