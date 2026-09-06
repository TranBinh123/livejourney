'use client';

import { CHECKPOINTS, TEAMS } from '@/lib/data';
import { AppState, TeamId } from '@/lib/types';

type Props = {
  state: AppState;
  onTeam: (id: TeamId) => void;
};

type RouteStep =
  | {
      type: 'checkpoint';
      index: number;
    }
  | {
      type: 'mist';
      indexes: number[];
    };

/*
 * Tuyến đường hiển thị trên màn hình Public.
 *
 * Không hiển thị số thứ tự checkpoint.
 * Không hiển thị tên các checkpoint trung gian.
 *
 * Một số checkpoint được gom vào vùng MÂY MÙ /
 * VÙNG KHÁM PHÁ để giữ bí mật hành trình.
 *
 * App vẫn quản lý đầy đủ toàn bộ checkpoint ở phía Admin.
 */
const ROUTE: RouteStep[] = [
  {
    type: 'checkpoint',
    index: 0,
  },
  {
    type: 'checkpoint',
    index: 1,
  },
  {
    type: 'checkpoint',
    index: 2,
  },
  {
    type: 'checkpoint',
    index: 3,
  },
  {
    type: 'mist',
    indexes: [4, 5],
  },
  {
    type: 'checkpoint',
    index: 6,
  },
  {
    type: 'mist',
    indexes: [7],
  },
  {
    type: 'checkpoint',
    index: 8,
  },
  {
    type: 'checkpoint',
    index: 9,
  },
];

function getTeamsAtCheckpoint(
  state: AppState,
  checkpointIndex: number
) {
  const isFinish =
    checkpointIndex === CHECKPOINTS.length - 1;

  return TEAMS.filter((team) => {
    const teamState = state.teams[team.id];

    if (isFinish) {
      return (
        !!teamState.finishedAt ||
        teamState.current === checkpointIndex
      );
    }

    return (
      teamState.current === checkpointIndex &&
      !teamState.finishedAt
    );
  });
}

function TeamBadges({
  teams,
  onTeam,
  mobile = false,
}: {
  teams: typeof TEAMS;
  onTeam: (id: TeamId) => void;
  mobile?: boolean;
}) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        flex flex-wrap content-center gap-1
        ${
          mobile
            ? 'max-w-[54px]'
            : 'max-w-[64px]'
        }
      `}
    >
      {teams.map((team) => (
        <button
          key={team.id}
          type="button"
          onClick={() => onTeam(team.id)}
          aria-label={team.name}
          title={team.name}
          style={{
            borderColor: team.color,
            background: `${team.color}22`,
            boxShadow: `0 0 10px ${team.color}33`,
          }}
          className={`
            flex shrink-0
            items-center justify-center
            rounded-lg
            border
            transition-transform
            hover:scale-110
            active:scale-95
            ${
              mobile
                ? 'h-6 w-6 text-sm'
                : 'h-7 w-7 text-base'
            }
          `}
        >
          {team.icon}
        </button>
      ))}
    </div>
  );
}

function CheckpointNode({
  index,
  state,
  onTeam,
  mobile = false,
}: {
  index: number;
  state: AppState;
  onTeam: (id: TeamId) => void;
  mobile?: boolean;
}) {
  const checkpoint = CHECKPOINTS[index];

  if (!checkpoint) {
    return null;
  }

  const teamsHere = getTeamsAtCheckpoint(
    state,
    index
  );

  const isStart = index === 0;
  const isFinish =
    index === CHECKPOINTS.length - 1;
  const isActive = teamsHere.length > 0;

  return (
    <div className="relative z-10 flex flex-col items-center">
      {isStart && (
        <div
          className="
            mb-2
            whitespace-nowrap
            text-center
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-slate-200
            sm:text-xs
          "
        >
          XUẤT PHÁT
        </div>
      )}

      <div className="relative flex items-center justify-center">
        <div
          className={`
            relative
            flex
            items-center
            justify-center
            rounded-full
            border
            border-white/20
            bg-slate-950/75
            backdrop-blur-md
            shadow-lg
            transition-all
            ${
              mobile
                ? 'h-12 w-12 text-xl'
                : 'h-14 w-14 text-2xl'
            }
            ${
              isActive
                ? 'scale-110 border-white/50 pulse'
                : ''
            }
            ${
              isFinish
                ? 'ring-2 ring-amber-300/50'
                : ''
            }
          `}
        >
          <span className="relative z-10">
            {checkpoint.symbol}
          </span>

          {isActive && (
            <span
              className="
                absolute
                -inset-1
                rounded-full
                border
                border-white/20
                animate-ping
              "
            />
          )}
        </div>

        {isActive && (
          <div
            className="
              absolute
              left-full
              top-1/2
              ml-2
              -translate-y-1/2
            "
          >
            <TeamBadges
              teams={teamsHere}
              onTeam={onTeam}
              mobile={mobile}
            />
          </div>
        )}
      </div>

      {isFinish && (
        <div
          className="
            mt-2
            whitespace-nowrap
            text-center
            text-[10px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-amber-200
            sm:text-xs
          "
        >
          ĐÍCH ĐẾN
        </div>
      )}
    </div>
  );
}

function MistZone({
  indexes,
  state,
  onTeam,
  mobile = false,
}: {
  indexes: number[];
  state: AppState;
  onTeam: (id: TeamId) => void;
  mobile?: boolean;
}) {
  const teamsInMist = TEAMS.filter((team) => {
    const teamState = state.teams[team.id];

    if (!teamState || teamState.finishedAt) {
      return false;
    }

    return indexes.includes(teamState.current);
  });

  return (
    <div
      className={`
        relative
        z-10
        flex
        w-full
        justify-center
        ${
          mobile
            ? 'py-3'
            : 'py-5'
        }
      `}
    >
      <div className="relative flex items-center">
        <div
          className={`
            relative
            flex
            min-h-[96px]
            flex-col
            items-center
            justify-center
            overflow-hidden
            rounded-[30px]
            border
            border-white/10
            bg-white/[0.055]
            px-4
            backdrop-blur-sm
            ${
              mobile
                ? 'w-[190px]'
                : 'w-[300px]'
            }
          `}
        >
          {/* Mây nền */}
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <span
              className="
                absolute
                -left-3
                top-2
                text-3xl
                blur-[1px]
              "
            >
              ☁️
            </span>

            <span
              className="
                absolute
                left-[25%]
                top-9
                text-2xl
                opacity-80
                blur-[1px]
              "
            >
              ☁️
            </span>

            <span
              className="
                absolute
                right-0
                top-4
                text-3xl
                blur-[1px]
              "
            >
              ☁️
            </span>

            <span
              className="
                absolute
                bottom-0
                left-[12%]
                text-2xl
                opacity-70
              "
            >
              ☁️
            </span>

            <span
              className="
                absolute
                bottom-1
                right-[15%]
                text-2xl
                opacity-70
              "
            >
              ☁️
            </span>
          </div>

          <div
            className="
              relative
              z-10
              mb-1
              text-xs
              tracking-[0.45em]
              text-slate-400
            "
          >
            · · ·
          </div>

          <div
            className="
              relative
              z-10
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-slate-300
              sm:text-xs
            "
          >
            MÂY MÙ
          </div>

          <div
            className="
              relative
              z-10
              mt-1
              text-[9px]
              uppercase
              tracking-[0.15em]
              text-slate-500
              sm:text-[10px]
            "
          >
            VÙNG KHÁM PHÁ
          </div>
        </div>

        {teamsInMist.length > 0 && (
          <div
            className="
              absolute
              left-full
              top-1/2
              ml-2
              -translate-y-1/2
            "
          >
            <TeamBadges
              teams={teamsInMist}
              onTeam={onTeam}
              mobile={mobile}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function VerticalLine() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      viewBox="0 0 100 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="
          M 50 0
          C 50 45, 42 65, 42 95
          S 58 145, 58 190
          S 42 240, 42 285
          S 58 335, 58 380
          S 42 430, 42 475
          S 58 525, 58 570
          S 42 620, 42 665
          S 58 715, 58 760
          S 42 810, 42 855
          S 50 920, 50 1000
        "
        fill="none"
        stroke="rgba(255, 55, 75, 0.9)"
        strokeWidth="1.4"
        strokeDasharray="1.5 8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* =========================================================
   STRAIGHT VERTICAL ROUTE (dùng chung cho mobile & desktop)
   ========================================================= */

function StraightRoute({
  state,
  onTeam,
  mobile = false,
}: Props & { mobile?: boolean }) {
  return (
    <div
      className={`
        relative
        mx-auto
        w-full
        ${
          mobile
            ? 'max-w-[280px] py-4'
            : 'max-w-md py-8'
        }
      `}
    >
      <VerticalLine />

      <div className="relative flex flex-col items-center">
        {ROUTE.map((step, routeIndex) => {
          if (step.type === 'mist') {
            return (
              <MistZone
                key={`mist-${routeIndex}`}
                indexes={step.indexes}
                state={state}
                onTeam={onTeam}
                mobile={mobile}
              />
            );
          }

          return (
            <div
              key={`checkpoint-${step.index}`}
              className={`
                relative
                flex
                w-full
                items-center
                justify-center
                ${
                  mobile
                    ? 'min-h-[86px]'
                    : 'min-h-[108px]'
                }
              `}
            >
              <CheckpointNode
                index={step.index}
                state={state}
                onTeam={onTeam}
                mobile={mobile}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
   ========================================================= */

export default function Timeline({
  state,
  onTeam,
}: Props) {
  return (
    <>
      {/* Mobile */}
      <div className="block md:hidden">
        <StraightRoute
          state={state}
          onTeam={onTeam}
          mobile
        />
      </div>

      {/* Desktop / TV */}
      <div className="hidden md:block">
        <StraightRoute
          state={state}
          onTeam={onTeam}
        />
      </div>
    </>
  );
}
