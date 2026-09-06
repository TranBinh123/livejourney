import {
  AppState,
  Checkpoint,
  Team,
  TeamId,
  TeamState,
  Round2Rules,
} from './types';

// ======================================================
// DANH SÁCH 4 ĐỘI
// ======================================================

export const TEAMS: Team[] = [
  {
    id: 'ops',
    name: 'Ban Vận hành',
    color: '#35c759',
    icon: '⚙️',
  },
  {
    id: 'food',
    name: 'Ban Ẩm thực',
    color: '#ffd60a',
    icon: '🧑‍🍳',
  },
  {
    id: 'tech',
    name: 'Ban Kỹ thuật',
    color: '#0a84ff',
    icon: '🔧',
  },
  {
    id: 'mgmt',
    name: 'Ban do Giám đốc quản lý',
    color: '#ff453a',
    icon: '🤝',
  },
];

// ======================================================
// CHECKPOINT
// ======================================================

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 0,
    name: 'Cổng Thời Gian',
    symbol: '🕰️',
    challenges: 0,
  },
  {
    id: 1,
    name: 'Con trâu',
    symbol: '🦁',
    challenges: 2,
  },
  {
    id: 2,
    name: 'Khu vực chân núi',
    symbol: '🚡',
    challenges: 2,
  },
  {
    id: 3,
    name: 'Vườn hoa',
    symbol: '🚀',
    challenges: 2,
  },
  {
    id: 4,
    name: 'Nhà cổ',
    symbol: '💐',
    challenges: 2,
  },
  {
    id: 5,
    name: 'Quảng trường nhật thực',
    symbol: '🚩',
    challenges: 2,
  },
  {
    id: 6,
    name: 'Con rồng',
    symbol: '🌤️',
    challenges: 2,
  },
  {
    id: 7,
    name: 'Fantasy Park',
    symbol: '💥',
    challenges: 2,
  },
  {
    id: 8,
    name: 'Thác thần mặt trời',
    symbol: '⛰️',
    challenges: 2,
  },
  {
    id: 9,
    name: 'Cột mốc 1487',
    symbol: '🏆',
    challenges: 2,
  },
];

// ======================================================
// THỂ LỆ VÒNG 2
// Admin có thể chỉnh sửa các nội dung này.
// ======================================================

export const DEFAULT_ROUND2_RULES: Round2Rules = {
  title: 'VÒNG 2 – LÊN CÁP',
  date: '07/09/2026',
  time: '08h30',
  location: 'CỔNG THỜI GIAN',
  content:
    'Các đội giải mật thư, vượt qua các thử thách tại các địa điểm và tìm đến điểm đích cuối cùng. Tại mỗi địa điểm, đội có thể hoàn thành Thử thách 1, Thử thách 2 hoặc bỏ qua thử thách để tiếp tục hành trình. Việc hoàn thành địa điểm được Admin xác nhận độc lập với việc hoàn thành thử thách.',
};

// ======================================================
// STATE BAN ĐẦU
// ======================================================

const emptyTeamState = (): TeamState => ({
  current: 0,
  challengesDone: {},
  completedAt: {},
});

export const INITIAL: AppState = {
  version: 3,

  teams: {
    ops: emptyTeamState(),
    food: emptyTeamState(),
    tech: emptyTeamState(),
    mgmt: emptyTeamState(),
  },

  round2Rules: DEFAULT_ROUND2_RULES,
};

export const teamById = (id: TeamId) =>
  TEAMS.find((t) => t.id === id)!;
