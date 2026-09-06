'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import {
  TEAMS,
} from '@/lib/data';

import { useLiveState } from '@/lib/store';

import type { TeamId, TeamScoreResult } from '@/lib/types';

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

  const rules =
    state.round2Rules;

  // ====================================================
  // FINISH RANKING / CÔNG BỐ KẾT QUẢ
  // ====================================================

  const liveRank = TEAMS
    .map((team) => ({
      team,
      at: state.teams[team.id].finishedAt,
    }))
    .filter((item) => !!item.at)
    .sort(
      (a, b) =>
        new Date(a.at!).getTime() -
        new Date(b.at!).getTime()
    );

  const publishedResults: TeamScoreResult[] =
    state.finalResults || [];

  const rank: Array<{
    result: TeamScoreResult | null;
    team: (typeof TEAMS)[number];
    at: string | undefined;
    liveRank: number;
  }> = publishedResults.length
    ? publishedResults
        .filter((item) => item.finished)
        .sort(
          (a, b) =>
            (a.finishRank ?? 999) -
            (b.finishRank ?? 999)
        )
        .map((result, index) => ({
          result,
          team:
            TEAMS.find(
              (team) => team.id === result.teamId
            )!,
          at:
            state.teams[result.teamId]
              .finishedAt,
          liveRank:
            result.finishRank ?? index + 1,
        }))
    : liveRank.map((item, index) => ({
        result: null,
        team: item.team,
        at: item.at,
        liveRank: index + 1,
      }));

  const getFinishRank = (teamId: TeamId) => {
    const published = publishedResults.find(
      (item) => item.teamId === teamId
    );

    if (published?.finishRank) {
      return published.finishRank;
    }

    const index = liveRank.findIndex(
      (item) => item.team.id === teamId
    );

    return index >= 0 ? index + 1 : null;
  };

  const formatFinishTime = (value?: string) =>
    value
      ? new Date(value).toLocaleTimeString(
          'vi-VN',
          {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }
        )
      : '--:--:--';

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
                      ? 'ĐÃ VỀ ĐÍCH'
                      : 'ĐANG DI CHUYỂN'}
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
                      ? '🏆 ĐÃ VỀ ĐÍCH'
                      : '🚶 ĐANG DI CHUYỂN'}
                  </div>

                </div>

              </div>

              {teamState.finishedAt ? (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">
                      Thứ hạng
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-1">
                      #{getFinishRank(selectedTeam.id) ?? '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">
                      Về đích lúc
                    </div>
                    <div className="text-lg font-black text-white mt-2">
                      {formatFinishTime(
                        teamState.finishedAt
                      )}
                    </div>
                  </div>

                  {publishedResults.length > 0 && (
                    <div className="col-span-2 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        Điểm chung cuộc
                      </div>
                      <div className="text-3xl font-black text-amber-300 mt-1">
                        {publishedResults.find(
                          (item) =>
                            item.teamId ===
                            selectedTeam.id
                        )?.finalScore ?? 0}
                        <span className="text-sm ml-1">
                          điểm
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 p-4 rounded-2xl bg-black/20 text-sm text-slate-400">
                  Hành trình của đội đang được giữ bí mật.
                  Theo dõi bảng xếp hạng và thời điểm về đích
                  tại đây nhé!
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

          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm md:text-base">
                🏆 {publishedResults.length
                  ? 'KẾT QUẢ CHUNG CUỘC'
                  : 'THỨ HẠNG VỀ ĐÍCH'}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                {publishedResults.length && state.tallyAt
                  ? `Đã tổng hợp lúc ${formatFinishTime(
                      state.tallyAt
                    )}`
                  : 'Cập nhật theo thời điểm các đội về đích'}
              </p>
            </div>

            <span className="text-[10px] uppercase tracking-widest text-emerald-300">
              LIVE
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-2 mt-3">

            {rank.map((item, index) => (
              <button
                key={item.team.id}
                type="button"
                onClick={() => setSelected(item.team.id)}
                className="rounded-xl bg-black/20 p-3 text-left hover:bg-white/5 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold truncate">
                    {['🥇', '🥈', '🥉', '🏅'][index]}{' '}
                    {item.team.name}
                  </span>

                  <span className="font-black text-amber-300 shrink-0">
                    #{item.result?.finishRank ?? item.liveRank}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {formatFinishTime(item.at)}
                  </span>

                  {item.result ? (
                    <b className="text-amber-300">
                      {item.result.finalScore}đ
                    </b>
                  ) : (
                    <span>Đã về đích</span>
                  )}
                </div>
              </button>
            ))}

          </div>

        </div>

      )}

    </main>
  );
}
