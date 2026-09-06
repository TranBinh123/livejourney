'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import {
  TEAMS,
  CHECKPOINTS,
} from '@/lib/data';

import { useLiveState } from '@/lib/store';

import { TeamId } from '@/lib/types';

import Timeline from './Timeline';

export default function PublicScreen() {
  const state = useLiveState();

  const [selected, setSelected] =
    useState<TeamId | null>(null);

  const selectedTeam =
    selected
      ? TEAMS.find(
          (team) => team.id === selected
        )
      : null;

  const teamState =
    selected
      ? state.teams[selected]
      : null;

  const currentCheckpoint =
    teamState
      ? CHECKPOINTS[
          teamState.current
        ]
      : null;

  const rules =
    state.round2Rules;

  // ====================================================
  // FINISH RANKING
  // ====================================================

  const rank = TEAMS
    .map((team) => ({
      team,
      at: state.teams[
        team.id
      ].finishedAt,
    }))
    .filter(
      (item) => !!item.at
    )
    .sort(
      (a, b) =>
        new Date(a.at!).getTime() -
        new Date(b.at!).getTime()
    );

  return (
    <main className="min-h-screen grid-bg overflow-x-hidden">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="px-4 md:px-10 py-4 md:py-5 flex items-center justify-between gap-2">

        <div className="min-w-0">

          <div className="text-[9px] md:text-[10px] tracking-[.35em] text-amber-300">
            THE BANACODE
          </div>

          <h1 className="text-xl md:text-4xl font-black tracking-tight leading-tight">
            HÀNH TRÌNH{' '}
            <span className="text-amber-300">
              19 NĂM
            </span>
          </h1>

        </div>

        <Link
          href="/admin"
          aria-label="Admin"
          title="Quản trị"
          className="glass rounded-xl w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-300 shrink-0"
        >
          <Settings size={18} />
        </Link>

      </header>

      {/* ==================================================
          THỂ LỆ VÒNG 2
      ================================================== */}

      {rules && (
        <section className="mx-3 md:mx-8 mb-4 glass rounded-[24px] overflow-hidden">

          <div className="relative p-4 md:p-7">

            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,rgba(246,200,95,.16),transparent_35%)]" />

            <div className="relative">

              <div className="text-[9px] md:text-xs tracking-[.3em] text-amber-300">
                THỂ LỆ VÒNG 2
              </div>

              <h2 className="text-xl md:text-3xl font-black mt-1">
                {rules.title}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mt-4">

                <div className="rounded-xl bg-black/20 p-3">

                  <div className="text-[9px] uppercase tracking-widest text-slate-500">
                    Ngày
                  </div>

                  <div className="font-bold text-sm md:text-base mt-1">
                    {rules.date}
                  </div>

                </div>

                <div className="rounded-xl bg-black/20 p-3">

                  <div className="text-[9px] uppercase tracking-widest text-slate-500">
                    Thời gian
                  </div>

                  <div className="font-bold text-sm md:text-base mt-1">
                    {rules.time}
                  </div>

                </div>

                <div className="rounded-xl bg-black/20 p-3 col-span-2 md:col-span-1">

                  <div className="text-[9px] uppercase tracking-widest text-slate-500">
                    Tập trung
                  </div>

                  <div className="font-bold text-sm md:text-base mt-1">
                    {rules.location}
                  </div>

                </div>

              </div>

              {rules.content && (
                <div className="mt-4 text-xs md:text-sm text-slate-300 leading-relaxed max-w-5xl">
                  {rules.content}
                </div>
              )}

            </div>

          </div>

        </section>
      )}

      {/* ==================================================
          TIMELINE
      ================================================== */}

      <section className="mx-3 md:mx-8 glass rounded-[24px] relative overflow-hidden">

        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 35%,rgba(246,200,95,.18),transparent 38%)',
          }}
        />

        <div className="relative p-4 md:p-10">

          <div className="flex items-center justify-between gap-2">

            <div>

              <p className="text-[10px] md:text-xs uppercase tracking-[.3em] text-slate-400">
                HÀNH TRÌNH
              </p>

              <p className="text-slate-300 mt-1 text-sm">
                Theo dõi vị trí các đội theo thời gian thực
              </p>

            </div>

            <div className="text-right text-[10px] md:text-xs text-slate-400 shrink-0">

              LIVE{' '}

              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1" />

            </div>

          </div>

          <div className="mt-4">

            <Timeline
              state={state}
              onTeam={setSelected}
            />

          </div>

        </div>

      </section>

      {/* ==================================================
          TEAM CARDS
      ================================================== */}

      <section className="p-3 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">

        {TEAMS.map((team) => {

          const current =
            state.teams[
              team.id
            ];

          const checkpoint =
            CHECKPOINTS[
              current.current
            ];

          return (
            <button
              key={team.id}
              onClick={() =>
                setSelected(team.id)
              }
              className="glass rounded-2xl p-3 md:p-4 text-left hover:translate-y-[-2px] transition"
            >

              <div className="flex items-center gap-2 md:gap-3">

                <span
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl shrink-0"
                  style={{
                    background:
                      team.color + '22',
                    border:
                      `1px solid ${team.color}66`,
                  }}
                >
                  {team.icon}
                </span>

                <div className="min-w-0">

                  <div
                    className="font-bold text-sm md:text-base truncate"
                    style={{
                      color: team.color,
                    }}
                  >
                    {team.name}
                  </div>

                  <div className="text-[11px] md:text-xs text-slate-400 truncate">
                    {current.finishedAt
                      ? 'FINISH'
                      : checkpoint.name}
                  </div>

                </div>

              </div>

            </button>
          );
        })}

      </section>

      {/* ==================================================
          TEAM DETAIL POPUP
      ================================================== */}

      {selectedTeam &&
        teamState && (
          <div
            className="fixed inset-0 bg-black/65 flex items-end md:items-center justify-center p-4 z-50"
            onClick={() =>
              setSelected(null)
            }
          >

            <div
              className="glass rounded-3xl p-6 w-full max-w-md"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="flex items-center gap-3">

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background:
                      selectedTeam.color +
                      '22',
                  }}
                >
                  {selectedTeam.icon}
                </div>

                <div>

                  <h2
                    className="text-xl font-black"
                    style={{
                      color:
                        selectedTeam.color,
                    }}
                  >
                    {selectedTeam.name.toUpperCase()}
                  </h2>

                  <div className="text-sm text-slate-400">
                    {teamState.finishedAt
                      ? '🏆 FINISH'
                      : `Vị trí: ${currentCheckpoint?.name}`}
                  </div>

                </div>

              </div>

              {currentCheckpoint &&
                currentCheckpoint.challenges >
                  0 && (

                  <div className="mt-5 p-4 rounded-2xl bg-black/20">

                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Tiến độ thử thách tại đây
                    </div>

                    <div className="mt-3 space-y-2">

                      {Array.from({
                        length:
                          currentCheckpoint.challenges,
                      }).map(
                        (_, index) => {

                          const done =
                            !!teamState
                              .challengesDone[
                              teamState.current
                            ]?.[
                              index
                            ];

                          return (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >

                              <span>
                                Thử thách{' '}
                                {index + 1}
                              </span>

                              <span
                                className={
                                  done
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                                }
                              >
                                {done
                                  ? '✓ Hoàn thành'
                                  : '✕ Chưa hoàn thành'}
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              <div className="mt-4 text-sm">

                <span className="text-slate-400">
                  Trạng thái:
                </span>{' '}

                {teamState.finishedAt
                  ? 'Đã hoàn thành hành trình'
                  : teamState.completedAt[
                      teamState.current
                    ]
                  ? 'Đã hoàn thành địa điểm'
                  : 'Đang ở checkpoint'}

              </div>

              {Object.keys(
                teamState.completedAt
              ).length > 0 && (

                <div className="mt-5">

                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                    Lịch sử
                  </div>

                  <div className="max-h-36 overflow-auto space-y-1 text-xs text-slate-400">

                    {Object.entries(
                      teamState.completedAt
                    ).map(
                      ([key, value]) => (

                        <div
                          key={key}
                          className="flex justify-between"
                        >

                          <span>
                            {
                              CHECKPOINTS[
                                Number(key)
                              ].name
                            }
                          </span>

                          <span>
                            {new Date(
                              value
                            ).toLocaleTimeString(
                              'vi-VN'
                            )}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>
              )}

              <button
                className="mt-6 w-full rounded-xl py-3 bg-white/10"
                onClick={() =>
                  setSelected(null)
                }
              >
                Đóng
              </button>

            </div>

          </div>
        )}

      {/* ==================================================
          FINISH RANKING
      ================================================== */}

      {rank.length > 0 && (

        <div className="mx-3 md:mx-8 mb-8 glass rounded-2xl p-4 md:p-5">

          <h3 className="font-black text-sm md:text-base">
            🏆 FINISH RANKING
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">

            {rank.map((item, index) => (

              <div
                key={item.team.id}
                className="rounded-xl bg-black/20 p-3 flex justify-between text-sm"
              >

                <span>
                  {['🥇', '🥈', '🥉', '🏅'][index]}{' '}
                  {item.team.name}
                </span>

                <b>
                  {[100, 80, 60, 40][index]}
                </b>

              </div>

            ))}

          </div>

        </div>

      )}

    </main>
  );
}
