import { CHECKPOINTS, TEAMS } from './data';
import { AppState, TeamId } from './types';

export type TeamScoreResult = {
  teamId: TeamId;
  name: string;
  color: string;
  icon: string;

  finished: boolean;
  finishRank: number | null;

  // Điểm theo thứ hạng về đích
  basePoints: number;

  // Số thử thách phải hoàn thành
  totalChallenges: number;

  // Số thử thách đã hoàn thành
  totalChallengesDone: number;

  // Số thử thách chưa hoàn thành
  totalChallengesNotDone: number;

  // Điểm bị trừ
  penalty: number;

  // Điểm cuối cùng
  finalScore: number;
};

export function computeFinalScores(
  state: AppState
): TeamScoreResult[] {

  /*
   * ============================================================
   * 1. XÁC ĐỊNH THỨ HẠNG VỀ ĐÍCH
   * ============================================================
   */

  const finished = TEAMS
    .map(team => ({
      team,
      state: state.teams[team.id],
    }))
    .filter(item => !!item.state.finishedAt)
    .sort((a, b) => {
      const timeA = new Date(a.state.finishedAt!).getTime();
      const timeB = new Date(b.state.finishedAt!).getTime();

      return timeA - timeB;
    });

  const rankByTeam = new Map<TeamId, number>();

  finished.forEach((item, index) => {
    rankByTeam.set(item.team.id, index + 1);
  });

  /*
   * ============================================================
   * 2. ĐIỂM THEO THỨ HẠNG
   * ============================================================
   *
   * Hạng 1 = 100
   * Hạng 2 = 80
   * Hạng 3 = 60
   * Hạng 4 = 40
   */

  const pointsByRank: Record<number, number> = {
    1: 100,
    2: 80,
    3: 60,
    4: 40,
  };

  /*
   * ============================================================
   * 3. TÍNH ĐIỂM CHO TỪNG ĐỘI
   * ============================================================
   */

  const results: TeamScoreResult[] = TEAMS.map(team => {

    const teamState = state.teams[team.id];

    /*
     * Tổng số thử thách phải thực hiện.
     *
     * Lấy theo cấu hình CHECKPOINTS.
     * Cổng thời gian có 0 thử thách.
     * Các checkpoint có 2 thử thách sẽ tính đủ 2.
     */
    const totalChallenges = CHECKPOINTS.reduce(
      (total, checkpoint) => {
        return total + checkpoint.challenges;
      },
      0
    );

    /*
     * Đếm số thử thách đã hoàn thành.
     *
     * challengesDone có dạng:
     *
     * {
     *   1: [true, false],
     *   2: [true, true],
     *   3: [false, false]
     * }
     *
     * Mỗi true = 1 thử thách hoàn thành.
     */

    const totalChallengesDone = Object.values(
      teamState.challengesDone || {}
    ).reduce((total, challengeArray) => {

      return (
        total +
        challengeArray.filter(Boolean).length
      );

    }, 0);

    /*
     * Số thử thách chưa hoàn thành
     */

    const totalChallengesNotDone = Math.max(
      0,
      totalChallenges - totalChallengesDone
    );

    /*
     * ============================================================
     * 4. ĐIỂM CƠ BẢN THEO THỨ HẠNG
     * ============================================================
     */

    const finishRank =
      rankByTeam.get(team.id) ?? null;

    const basePoints =
      finishRank !== null
        ? pointsByRank[finishRank] ?? 0
        : 0;

    /*
     * ============================================================
     * 5. TÍNH ĐIỂM PHẠT
     * ============================================================
     *
     * MỖI THỬ THÁCH KHÔNG HOÀN THÀNH = -10 ĐIỂM
     *
     * Ví dụ:
     *
     * 0 thử thách chưa hoàn thành
     * => phạt 0
     *
     * 1 thử thách chưa hoàn thành
     * => phạt -10
     *
     * 2 thử thách chưa hoàn thành
     * => phạt -20
     *
     * 5 thử thách chưa hoàn thành
     * => phạt -50
     */

    const penalty =
      totalChallengesNotDone * -10;

    /*
     * ============================================================
     * 6. ĐIỂM CUỐI CÙNG
     * ============================================================
     */

    const finalScore =
      basePoints + penalty;

    return {
      teamId: team.id,
      name: team.name,
      color: team.color,
      icon: team.icon,

      finished: !!teamState.finishedAt,
      finishRank,

      basePoints,

      totalChallenges,
      totalChallengesDone,
      totalChallengesNotDone,

      penalty,

      finalScore,
    };
  });

  /*
   * ============================================================
   * 7. SẮP XẾP KẾT QUẢ
   * ============================================================
   *
   * Đội đã về đích đứng trước.
   * Trong nhóm đã về đích: theo thứ hạng về đích.
   */

  return results.sort((a, b) => {

    if (a.finished !== b.finished) {
      return a.finished ? -1 : 1;
    }

    if (
      a.finished &&
      b.finished &&
      a.finishRank !== null &&
      b.finishRank !== null
    ) {
      return a.finishRank - b.finishRank;
    }

    return 0;
  });
}
