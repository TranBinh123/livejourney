export type TeamId =
  | 'ops'
  | 'food'
  | 'tech'
  | 'mgmt';

export type Team = {
  id: TeamId;
  name: string;
  color: string;
  icon: string;
};

export type TeamScoreResult = {
  teamId: TeamId;
  name: string;
  color: string;
  icon: string;

  finished: boolean;
  finishRank: number | null;

  basePoints: number;
  totalChallenges: number;
  totalChallengesDone: number;
  totalChallengesNotDone: number;
  penalty: number;
  finalScore: number;
};

export type Checkpoint = {
  id: number;
  name: string;
  symbol: string;
  challenges: number;
};

export type TeamState = {
  current: number;

  /*
   * Ví dụ:
   *
   * {
   *   1: [true, false],
   *   2: [true, true]
   * }
   */
  challengesDone: Record<
    number,
    boolean[]
  >;

  /*
   * Thời điểm hoàn thành từng địa điểm
   */
  completedAt: Record<
    number,
    string
  >;

  /*
   * Thời điểm về đích
   */
  finishedAt?: string;
};

/*
 * ============================================================
 * THỂ LỆ VÒNG 2
 * ============================================================
 */

export type Round2Rules = {
  title: string;

  /*
   * Ngày tổ chức
   * Ví dụ: 07/09/2026
   */
  date: string;

  /*
   * Giờ tập trung
   * Ví dụ: 08h30
   */
  time: string;

  /*
   * Địa điểm tập trung
   */
  location: string;

  /*
   * Nội dung thể lệ.
   *
   * Có thể dùng nhiều dòng.
   */
  content: string;

  /*
   * Thời điểm Admin cập nhật thể lệ
   */
  updatedAt?: string;
};

export type AppState = {
  version: number;

  teams: Record<
    TeamId,
    TeamState
  >;

  /*
   * Thể lệ Vòng 2.
   *
   * Để optional để tránh làm hỏng
   * dữ liệu AppState cũ đang có trên Supabase.
   */
  round2Rules?: Round2Rules;

  /** Kết quả đã được Admin tổng hợp và công bố */
  finalResults?: TeamScoreResult[];
  tallyAt?: string;
};
