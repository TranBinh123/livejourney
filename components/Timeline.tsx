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
      side: 'left' | 'right';
    }
  | {
      type: 'mist';
      indexes: number[];
    };

/*
 * Bản đồ công khai không hiển thị toàn bộ checkpoint theo dạng
 * đánh số tuần tự.
 *
 * Các checkpoint được gom vào vùng "Mây mù / Vùng khám phá"
 * để giữ bí mật hành trình.
 *
 * Tất cả checkpoint thật vẫn tồn tại trong AppState và Admin.
 */
const ROUTE: RouteStep[] = [
  {
    type: 'checkpoint',
    index: 0,
    side: 'center',
  } as RouteStep,

  {
    type: 'checkpoint',
    index: 1,
    side: 'right',
  },

  {
    type: 'checkpoint',
    index: 2,
    side: 'left',
  },

  {
    type: 'checkpoint',
    index: 3,
    side: 'right',
  },

  {
    type: 'mist',
    indexes: [4, 5],
  },

  {
    type: 'checkpoint',
    index: 6,
    side: 'left',
  },

  {
    type: 'mist',
    indexes: [7],
  },

  {
    type: 'checkpoint',
    index: 8,
    side: 'right',
  },

  {
    type: 'checkpoint',
    index: 9,
    side: 'center',
  },
];

function getTeamsAtCheckpoint(
  state: AppState,
  checkpointIndex: number
) {
  const isFinish = checkpointIndex === CHECKPOINTS.length - 1;

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

function TeamMarkers({
  teams,
  onTeam,
}: {
  teams: typeof TEAMS;
  onTeam: (id: TeamId) => void;
}) {
  if (!teams.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
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
            boxShadow: `0 0 14px ${team.color}33`,
          }}
          className="
            w-9 h-9
            rounded-xl
            border
            flex
            items-center
            justify-center
            text-base
            shrink-0
            transition-all
            hover:scale-110
            active:scale-95
          "
        >
          {team.icon}
        </button>
      ))}
    </div>
  );
}

function CheckpointNode({
  index,
  side,
  state,
  onTeam,
}: {
  index: number;
  side: 'left' | 'right' | 'center';
  state: AppState;
  onTeam: (id: TeamId) => void;
}) {
  const checkpoint = CHECKPOINTS[index];

  if (!checkpoint) return null;

  const teamsHere = getTeamsAtCheckpoint(state, index);

  const isStart = index === 0;
  const isFinish = index === CHECKPOINTS.length - 1;
  const isActive = teamsHere.length > 0;

  return (
    <div
      className={`
        relative
        flex
        w-full
        items-center
        ${
          side === 'left'
            ? 'justify-start'
            : side === 'right'
            ? 'justify-end'
            : 'justify-center'
        }
      `}
    >
      <div
        className={`
          relative
          z-10
          flex
          flex-col
          items-center
          ${
            side === 'left'
              ? 'mr-[28%]'
              : side === 'right'
              ? 'ml-[28%]'
              : ''
          }
        `}
      >
        {isStart && (
          <div className="mb-2 text-[10px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-slate-200 text-center whitespace-nowrap">
            CỔNG THỜI GIAN
          </div>
        )}

        <div
          className={`
            relative
            flex
            h-12
            w-12
            sm:h-14
            sm:w-14
            items-center
            justify-center
            rounded-full
            border
            border-white/20
            bg-slate-950/70
            backdrop-blur-md
            text-xl
            sm:text-2xl
            shadow-lg
            transition-all
            ${
              isActive
                ? 'pulse scale-110 border-white/50'
                : ''
            }
            ${
              isFinish
                ? 'ring-2 ring-amber-300/50'
                : ''
            }
          `}
        >
          {checkpoint.symbol}

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

        <TeamMarkers
          teams={teamsHere}
          onTeam={onTeam}
        />

        {isFinish && (
          <div className="mt-2 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-amber-200 text-center whitespace-nowrap">
            ĐÍCH ĐẾN
          </div>
        )}
      </div>
    </div>
  );
}

function MistZone({
  indexes,
  state,
  onTeam,
}: {
  indexes: number[];
  state: AppState;
  onTeam: (id: TeamId) => void;
}) {
  const teamsInMist = TEAMS.filter((team) => {
    const current = state.teams[team.id]?.current;

    return (
      !state.teams[team.id]?.finishedAt &&
      indexes.includes(current)
    );
  });

  return (
    <div className="relative z-10 flex w-full justify-center py-3 sm:py-5">
      <div
        className="
          relative
          flex
          min-h-[92px]
          w-[76%]
          max-w-[310px]
          flex-col
          items-center
          justify-center
          overflow-hidden
          rounded-[28px]
          border
          border-white/10
          bg-white/[0.055]
          backdrop-blur-sm
        "
      >
        {/* Mây */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -left-4 top-3 text-3xl blur-[1px]">
            ☁️
          </div>

          <div className="absolute left-[28%] top-10 text-2xl opacity-80 blur-[1px]">
            ☁️
          </div>

          <div className="absolute right-0 top-5 text-3xl blur-[1px]">
            ☁️
          </div>

          <div className="absolute left-[12%] bottom-1 text-2xl opacity-70">
            ☁️
          </div>

          <div className="absolute right-[18%] bottom-2 text-2xl opacity-70">
            ☁️
          </div>
        </div>

        {/* Dấu chấm tạo cảm giác hành trình tiếp tục */}
        <div className="relative z-10 mb-1 tracking-[0.45em] text-xs text-slate-400">
          · · ·
        </div>

        <div className="relative z-10 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-slate-300">
          MÂY MÙ
        </div>

        <div className="relative z-10 mt-1 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-slate-500">
          VÙNG KHÁM PHÁ
        </div>

        {teamsInMist.length > 0 && (
          <div className="relative z-10">
            <TeamMarkers
              teams={teamsInMist}
              onTeam={onTeam}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function VerticalConnector() {
  return (
    <div
      className="
        absolute
        left-1/2
        top-0
        bottom-0
        -translate-x-1/2
        w-px
        bg-gradient-to-b
        from-transparent
        via-white/20
        to-transparent
      "
    />
  );
}

function MobileRoute({
  state,
  onTeam,
}: Props) {
  return (
    <div className="relative w-full py-3">
      <VerticalConnector />

      <div className="relative flex flex-col gap-1">
        {ROUTE.map((step, i) => {
          if (step.type === 'mist') {
            return (
              <MistZone
                key={`mist-${i}`}
                indexes={step.indexes}
                state={state}
                onTeam={onTeam}
              />
            );
          }

          return (
            <div
              key={`checkpoint-${step.index}`}
              className="relative flex min-h-[82px] items-center"
            >
              {/* Mũi tên ngang tạo hiệu ứng ziczac */}
              {step.side === 'left' && (
                <div className="absolute left-[25%] right-1/2 top-1/2 h-px bg-white/15">
                  <span className="absolute right-0 -top-[4px] text-[9px] text-white/40">
                    ▶
                  </span>
                </div>
              )}

              {step.side === 'right' && (
                <div className="absolute left-1/2 right-[25%] top-1/2 h-px bg-white/15">
                  <span className="absolute left-0 -top-[4px] text-[9px] text-white/40">
                    ◀
                  </span>
                </div>
              )}

              <CheckpointNode
                index={step.index}
                side={step.side}
                state={state}
                onTeam={onTeam}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopRoute({
  state,
  onTeam,
}: Props) {
  return (
    <div className="relative mx-auto w-full max-w-5xl py-8">
      <div
        className="
          absolute
          left-1/2
          top-5
          bottom-5
          -translate-x-1/2
          w-px
          bg-gradient-to-b
          from-transparent
          via-white/15
          to-transparent
        "
      />

      <div className="relative flex flex-col gap-2">
        {ROUTE.map((step, i) => {
          if (step.type === 'mist') {
            return (
              <MistZone
                key={`desktop-mist-${i}`}
                indexes={step.indexes}
                state={state}
                onTeam={onTeam}
              />
            );
          }

          const teamsHere = getTeamsAtCheckpoint(
            state,
            step.index
          );

          const checkpoint = CHECKPOINTS[step.index];

          if (!checkpoint) return null;

          const isStart = step.index === 0;
          const isFinish =
            step.index === CHECKPOINTS.length - 1;

          return (
            <div
              key={`desktop-${step.index}`}
              className="relative grid min-h-[100px] grid-cols-3 items-center"
            >
              {/* LEFT */}
              <div className="flex justify-end pr-10">
                {step.side === 'left' && (
                  <div className="flex items-center gap-4">
                    <div className="h-px w-28 bg-white/15 relative">
                      <span className="absolute right-0 -top-[5px] text-[10px] text-white/40">
                        ▶
                      </span>
                    </div>

                    <CheckpointNode
                      index={step.index}
                      side="center"
                      state={state}
                      onTeam={onTeam}
                    />
                  </div>
                )}
              </div>

              {/* CENTER */}
              <div className="flex justify-center">
                {step.side === 'center' && (
                  <CheckpointNode
                    index={step.index}
                    side="center"
                    state={state}
                    onTeam={onTeam}
                  />
                )}

                {!isStart &&
                  !isFinish &&
                  step.side !== 'left' &&
                  step.side !== 'right' &&
                  teamsHere.length > 0 && (
                    <TeamMarkers
                      teams={teamsHere}
                      onTeam={onTeam}
                    />
                  )}
              </div>

              {/* RIGHT */}
              <div className="flex justify-start pl-10">
                {step.side === 'right' && (
                  <div className="flex items-center gap-4">
                    <CheckpointNode
                      index={step.index}
                      side="center"
                      state={state}
                      onTeam={onTeam}
                    />

                    <div className="h-px w-28 bg-white/15 relative">
                      <span className="absolute left-0 -top-[5px] text-[10px] text-white/40">
                        ◀
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Timeline({
  state,
  onTeam,
}: Props) {
  return (
    <>
      {/* MOBILE */}
      <div className="block md:hidden">
        <MobileRoute
          state={state}
          onTeam={onTeam}
        />
      </div>

      {/* DESKTOP / TV */}
      <div className="hidden md:block">
        <DesktopRoute
          state={state}
          onTeam={onTeam}
        />
      </div>
    </>
  );
}
