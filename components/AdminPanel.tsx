'use client';

import {
  useEffect,
  useState,
  FormEvent,
} from 'react';

import Link from 'next/link';

import {
  CHECKPOINTS,
  TEAMS,
} from '@/lib/data';

import {
  load,
  saveAll,
  reset,
} from '@/lib/store';

import type {
  AppState,
  TeamId,
  Round2Rules,
  TeamScoreResult,
} from '@/lib/types';

import {
  ADMIN_PASSWORD,
  isAdminAuthed,
  setAdminAuthed,
} from '@/lib/auth';

import { computeFinalScores } from '@/lib/scoring';

// ======================================================
// HELPER
// ======================================================

function getLastCompletedCheckpoint(
  teamState: AppState['teams'][TeamId]
) {
  const entries = Object.entries(
    teamState.completedAt || {}
  );

  if (entries.length === 0) {
    return null;
  }

  const latest = entries
    .map(([id, at]) => ({
      id: Number(id),
      at,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.id) &&
        CHECKPOINTS[item.id]
    )
    .sort(
      (a, b) =>
        new Date(b.at).getTime() -
        new Date(a.at).getTime()
    )[0];

  return latest
    ? CHECKPOINTS[latest.id]
    : null;
}

// ======================================================
// COMPONENT
// ======================================================

export default function AdminPanel() {
  const [authed, setAuthed] =
    useState<boolean | null>(null);

  const [pwInput, setPwInput] =
    useState('');

  const [pwError, setPwError] =
    useState(false);

  const [draft, setDraft] =
    useState<AppState | null>(null);

  const [savedAt, setSavedAt] =
    useState<string | null>(null);

  const [results, setResults] =
    useState<TeamScoreResult[] | null>(null);

  const [showResults, setShowResults] =
    useState(false);

  // ====================================================
  // AUTH
  // ====================================================

  useEffect(() => {
    setAuthed(isAdminAuthed());
  }, []);

  // ====================================================
  // LOAD DATA
  // ====================================================

useEffect(() => {
  let mounted = true;

  async function loadData() {
    try {
      const state = await load();

      if (mounted) {
        setDraft(state);
      }
    } catch (error) {
      console.error(
        'Không thể tải dữ liệu quản trị:',
        error
      );

      if (mounted) {
        alert(
          'Không thể tải dữ liệu từ hệ thống. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  }

  loadData();

  return () => {
    mounted = false;
  };
}, []);

  // ====================================================
  // LOGIN
  // ====================================================

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();

    if (pwInput === ADMIN_PASSWORD) {
      setAdminAuthed();
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải...
      </main>
    );
  }

  // ====================================================
  // LOGIN SCREEN
  // ====================================================

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="glass rounded-2xl p-6 w-full max-w-sm"
        >
          <div className="text-xs tracking-[.3em] text-amber-300">
            THE BANACODE / ADMIN
          </div>

          <h1 className="text-xl font-black mt-1 mb-5">
            Đăng nhập quản trị
          </h1>

          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">
            Mật khẩu
          </label>

          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => {
              setPwInput(e.target.value);
              setPwError(false);
            }}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
            placeholder="Nhập mật khẩu"
          />

          {pwError && (
            <div className="text-xs text-red-400 mt-2">
              Sai mật khẩu, vui lòng thử lại.
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-4 text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2.5"
          >
            Vào trang quản trị
          </button>

          <Link
            href="/"
            className="block text-center text-xs text-slate-400 hover:text-slate-200 mt-4"
          >
            ← Quay lại màn hình chính
          </Link>
        </form>
      </main>
    );
  }

  // ====================================================
  // DATA LOADING
  // ====================================================

  if (!draft) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải dữ liệu...
      </main>
    );
  }

  // ====================================================
  // HELPERS
  // ====================================================

  const updateDraft = (
    updater: (next: AppState) => void
  ) => {
    setDraft((current) => {
      if (!current) return current;

      const next: AppState =
        JSON.parse(
          JSON.stringify(current)
        );

      updater(next);

      return next;
    });

    setSavedAt(null);
  };

  // ====================================================
  // SET LOCATION
  // ====================================================

  const setLocation = (
    team: TeamId,
    cp: number
  ) => {
    updateDraft((next) => {
      next.teams[team].current = cp;
    });
  };

  // ====================================================
  // TOGGLE CHALLENGE
  // ====================================================

  const toggleChallenge = (
    team: TeamId,
    cp: number,
    slot: number,
    value: boolean
  ) => {
    updateDraft((next) => {
      const teamState =
        next.teams[team];

      const arr =
        teamState.challengesDone[cp]
          ? [
              ...teamState
                .challengesDone[cp],
            ]
          : [false, false];

      arr[slot] = value;

      teamState.challengesDone[cp] =
        arr;
    });
  };

  // ====================================================
  // COMPLETE CHECKPOINT
  // ====================================================

  const toggleComplete = (
    team: TeamId,
    cp: number,
    value: boolean
  ) => {
    updateDraft((next) => {
      const teamState =
        next.teams[team];

      if (value) {
        const now =
          new Date().toISOString();

        // Ghi nhận thời điểm hoàn thành
        teamState.completedAt[cp] =
          now;

        // Nếu là checkpoint cuối
        // → ghi nhận về đích
        if (
          cp ===
          CHECKPOINTS.length - 1
        ) {
          teamState.finishedAt =
            now;

          return;
        }

        // Chưa phải đích
        // → tự động chuyển sang checkpoint kế tiếp
        teamState.current =
          cp + 1;
      } else {
        // Bỏ trạng thái hoàn thành
        delete teamState.completedAt[
          cp
        ];

        // Quay lại checkpoint vừa bỏ tick
        teamState.current = cp;

        // Nếu bỏ tick tại đích
        // → xoá trạng thái về đích
        if (
          cp ===
          CHECKPOINTS.length - 1
        ) {
          delete teamState.finishedAt;
        }
      }
    });
  };

  // ====================================================
  // UPDATE ROUND 2 RULES
  // ====================================================

  const updateRules = (
    field: keyof Round2Rules,
    value: string
  ) => {
    updateDraft((next) => {
      next.round2Rules = {
        ...(next.round2Rules || {
          title: '',
          date: '',
          time: '',
          location: '',
          content: '',
        }),
        [field]: value,
      };
    });
  };

  // ====================================================
  // SAVE
  // ====================================================

  const handleSave = async () => {
    if (!draft) return;

    try {
      await saveAll(draft);

      setSavedAt(
        new Date().toLocaleTimeString(
          'vi-VN'
        )
      );
    } catch {
      alert(
        'Không thể lưu dữ liệu. Vui lòng kiểm tra kết nối Supabase.'
      );
    }
  };

  // ====================================================
  // RESET
  // ====================================================

  const handleReset = async () => {
    if (
      !confirm(
        'Reset toàn bộ dữ liệu chương trình?'
      )
    ) {
      return;
    }

    const next = await reset();

    setDraft(next);
    setSavedAt(null);
    setResults(null);
    setShowResults(false);
  };

  // ====================================================
  // TALLY
  // ====================================================

  const handleTally = async () => {
    if (!draft) return;

    const calculated = computeFinalScores(draft);
    const next: AppState =
      JSON.parse(JSON.stringify(draft));

    // Lưu kết quả tổng hợp vào AppState để Public Screen
    // và các thiết bị khác có thể đọc được qua Supabase Realtime.
    next.finalResults = calculated;
    next.tallyAt = new Date().toISOString();

    setDraft(next);
    setResults(calculated);
    setShowResults(true);

    try {
      await saveAll(next);
      setSavedAt(
        new Date().toLocaleTimeString('vi-VN')
      );
    } catch {
      alert(
        'Không thể công bố kết quả. Vui lòng kiểm tra kết nối Supabase.'
      );
    }
  };

  // ====================================================
  // RULES
  // ====================================================

  const rules =
    draft.round2Rules || {
      title: '',
      date: '',
      time: '',
      location: '',
      content: '',
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="min-h-screen p-3 md:p-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">

        <div>
          <div className="text-xs tracking-[.3em] text-amber-300">
            THE BANACODE / ADMIN
          </div>

          <h1 className="text-2xl md:text-3xl font-black">
            LIVE CONTROL
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap">

          <button
            onClick={handleReset}
            className="text-xs text-red-300 border border-red-400/30 rounded-lg px-3 py-2"
          >
            Reset
          </button>

          <button
            onClick={handleTally}
            className="text-sm font-bold bg-amber-400 text-slate-950 rounded-lg px-4 py-2"
          >
            📊 Tổng hợp điểm
          </button>

          <button
            onClick={handleSave}
            className="text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2"
          >
            💾 Lưu
          </button>

          <Link
            href="/"
            className="text-sm bg-white/10 rounded-lg px-4 py-2 flex items-center"
          >
            Thoát
          </Link>

        </div>
      </header>

      {savedAt && (
        <div className="mb-5 text-xs text-emerald-400">
          ✓ Đã lưu lúc {savedAt}
        </div>
      )}

      {/* ==================================================
          MODULE THỂ LỆ VÒNG 2
      ================================================== */}

      <section className="glass rounded-2xl p-5 md:p-6 mb-6">

        <div className="flex flex-wrap justify-between gap-3 mb-5">

          <div>
            <div className="text-xs tracking-[.3em] text-amber-300">
              MODULE THỂ LỆ
            </div>

            <h2 className="text-xl md:text-2xl font-black mt-1">
              THỂ LỆ VÒNG 2
            </h2>
          </div>

          <div className="text-xs text-slate-500 self-end">
            Nội dung này sẽ hiển thị trên màn hình Public
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Tên vòng
            </label>

            <input
              value={rules.title}
              onChange={(e) =>
                updateRules(
                  'title',
                  e.target.value
                )
              }
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Ngày
            </label>

            <input
              value={rules.date}
              onChange={(e) =>
                updateRules(
                  'date',
                  e.target.value
                )
              }
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
              placeholder="07/09/2026"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Thời gian
            </label>

            <input
              value={rules.time}
              onChange={(e) =>
                updateRules(
                  'time',
                  e.target.value
                )
              }
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
              placeholder="08h30"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Địa điểm tập trung
            </label>

            <input
              value={rules.location}
              onChange={(e) =>
                updateRules(
                  'location',
                  e.target.value
                )
              }
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
              placeholder="CỔNG THỜI GIAN"
            />
          </div>

        </div>

        <div className="mt-4">

          <label className="block text-xs text-slate-500 mb-1">
            Nội dung / thể lệ
          </label>

          <textarea
            value={rules.content}
            onChange={(e) =>
              updateRules(
                'content',
                e.target.value
              )
            }
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-sm leading-relaxed resize-y"
          />

        </div>

      </section>

      {/* ==================================================
          4 ĐỘI
      ================================================== */}

      <section className="glass rounded-2xl p-4 md:p-5">

        <div className="mb-4">

          <div className="text-xs tracking-[.3em] text-amber-300">
            LIVE CONTROL
          </div>

          <h2 className="text-lg md:text-xl font-black mt-1">
            TRẠNG THÁI 4 ĐỘI
          </h2>

        </div>

        {/* ==================================================
            MOBILE
        ================================================== */}

        <div className="md:hidden space-y-3">

          {TEAMS.map((team) => {

            const teamState =
              draft.teams[team.id];

            const cp =
              CHECKPOINTS[
                teamState.current
              ];

            const done =
              teamState.challengesDone[
                teamState.current
              ] || [];

            const completed =
              !!teamState.completedAt[
                teamState.current
              ];

            const lastCompleted =
              getLastCompletedCheckpoint(
                teamState
              );

            return (
              <div
                key={team.id}
                className="rounded-2xl bg-black/20 p-4"
              >

                {/* TEAM */}

                <div className="flex items-center gap-2 mb-4">

                  <span className="text-xl">
                    {team.icon}
                  </span>

                  <span
                    className="font-bold"
                    style={{
                      color: team.color,
                    }}
                  >
                    {team.name}
                  </span>

                </div>

                {/* CURRENT LOCATION */}

                <label className="block text-xs text-slate-500 mb-1">
                  Đội đang ở
                </label>

                <select
                  value={teamState.current}
                  onChange={(e) =>
                    setLocation(
                      team.id,
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  {CHECKPOINTS.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>

                {/* LAST COMPLETED */}

                {lastCompleted && (
                  <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-3 py-2 text-xs text-emerald-300">
                    ✓ Đã hoàn thành gần nhất:{' '}
                    <b>
                      {lastCompleted.name}
                    </b>
                  </div>
                )}

                {/* CHALLENGES */}

                {cp.challenges > 0 && (
                  <div className="space-y-3 mt-4">

                    {cp.challenges >= 1 && (
                      <label className="flex items-center gap-2 text-sm">

                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-emerald-500"
                          checked={
                            !!done[0]
                          }
                          onChange={(e) =>
                            toggleChallenge(
                              team.id,
                              teamState.current,
                              0,
                              e.target.checked
                            )
                          }
                        />

                        Thử thách 1

                      </label>
                    )}

                    {cp.challenges >= 2 && (
                      <label className="flex items-center gap-2 text-sm">

                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-emerald-500"
                          checked={
                            !!done[1]
                          }
                          onChange={(e) =>
                            toggleChallenge(
                              team.id,
                              teamState.current,
                              1,
                              e.target.checked
                            )
                          }
                        />

                        Thử thách 2

                      </label>
                    )}

                  </div>
                )}

                {/* COMPLETE */}

                <label className="flex items-center gap-2 text-sm font-bold mt-4 pt-4 border-t border-white/10">

                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-amber-400"
                    checked={completed}
                    onChange={(e) =>
                      toggleComplete(
                        team.id,
                        teamState.current,
                        e.target.checked
                      )
                    }
                  />

                  Hoàn thành địa điểm

                </label>

                <div className="text-[11px] text-slate-500 mt-2">
                  Tick mục này để ghi nhận đội rời địa điểm và tự động chuyển sang điểm tiếp theo.
                </div>

              </div>
            );
          })}

        </div>

        {/* ==================================================
            DESKTOP
        ================================================== */}

        <div className="hidden md:block overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-white/10">

                <th className="p-3 text-left">
                  Đội chơi
                </th>

                <th className="p-3 text-left">
                  Địa điểm
                </th>

                <th className="p-3 text-center">
                  Thử thách 1
                </th>

                <th className="p-3 text-center">
                  Thử thách 2
                </th>

                <th className="p-3 text-center">
                  Hoàn thành
                </th>

                <th className="p-3 text-left">
                  Gần nhất đã hoàn thành
                </th>

              </tr>

            </thead>

            <tbody>

              {TEAMS.map((team) => {

                const teamState =
                  draft.teams[team.id];

                const cp =
                  CHECKPOINTS[
                    teamState.current
                  ];

                const done =
                  teamState.challengesDone[
                    teamState.current
                  ] || [];

                const completed =
                  !!teamState.completedAt[
                    teamState.current
                  ];

                const lastCompleted =
                  getLastCompletedCheckpoint(
                    teamState
                  );

                return (
                  <tr
                    key={team.id}
                    className="border-b border-white/10"
                  >

                    {/* TEAM */}

                    <td className="p-3">

                      <div className="flex items-center gap-2">

                        <span>
                          {team.icon}
                        </span>

                        <span
                          className="font-bold"
                          style={{
                            color: team.color,
                          }}
                        >
                          {team.name}
                        </span>

                      </div>

                    </td>

                    {/* LOCATION */}

                    <td className="p-3">

                      <select
                        value={
                          teamState.current
                        }
                        onChange={(e) =>
                          setLocation(
                            team.id,
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5"
                      >

                        {CHECKPOINTS.map(
                          (item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </option>
                          )
                        )}

                      </select>

                    </td>

                    {/* CHALLENGE 1 */}

                    <td className="p-3 text-center">

                      {cp.challenges >= 1 ? (
                        <input
                          type="checkbox"
                          className="w-6 h-6 accent-emerald-500"
                          checked={
                            !!done[0]
                          }
                          onChange={(e) =>
                            toggleChallenge(
                              team.id,
                              teamState.current,
                              0,
                              e.target.checked
                            )
                          }
                        />
                      ) : (
                        <span className="text-slate-600">
                          —
                        </span>
                      )}

                    </td>

                    {/* CHALLENGE 2 */}

                    <td className="p-3 text-center">

                      {cp.challenges >= 2 ? (
                        <input
                          type="checkbox"
                          className="w-6 h-6 accent-emerald-500"
                          checked={
                            !!done[1]
                          }
                          onChange={(e) =>
                            toggleChallenge(
                              team.id,
                              teamState.current,
                              1,
                              e.target.checked
                            )
                          }
                        />
                      ) : (
                        <span className="text-slate-600">
                          —
                        </span>
                      )}

                    </td>

                    {/* COMPLETE */}

                    <td className="p-3 text-center">

                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-amber-400"
                        checked={completed}
                        onChange={(e) =>
                          toggleComplete(
                            team.id,
                            teamState.current,
                            e.target.checked
                          )
                        }
                      />

                    </td>

                    {/* LAST COMPLETED */}

                    <td className="p-3">

                      {lastCompleted ? (
                        <div className="text-xs text-emerald-300">
                          ✓{' '}
                          {lastCompleted.name}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Chưa có
                        </span>
                      )}

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

        {/* ==================================================
            NOTE
        ================================================== */}

        <div className="mt-5 rounded-xl bg-white/[0.03] border border-white/5 p-4">

          <p className="text-xs text-slate-400 leading-relaxed">
            <b className="text-slate-300">
              Cách vận hành:
            </b>{' '}
            Chọn địa điểm đội đang đứng →
            tick Thử thách 1 / 2 nếu đã hoàn thành →
            tick <b>Hoàn thành địa điểm</b> khi đội
            rời địa điểm.
          </p>

          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            Đội có thể bỏ một hoặc cả hai thử thách
            để tiết kiệm thời gian và tiếp tục hành trình.
            Việc hoàn thành địa điểm hoàn toàn độc lập
            với việc hoàn thành thử thách.
          </p>

        </div>

      </section>

      {/* ==================================================
          TÍNH ĐIỂM
      ================================================== */}

      {showResults && results && (

        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
          onClick={() =>
            setShowResults(false)
          }
        >

          <div
            className="glass rounded-3xl p-5 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="text-xs tracking-[.3em] text-amber-300">
              TỔNG HỢP ĐIỂM
            </div>

            <h2 className="text-xl md:text-2xl font-black mt-1 mb-2">
              KẾT QUẢ CHUNG CUỘC
            </h2>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Điểm về đích:
              hạng 1 = 100đ ·
              hạng 2 = 80đ ·
              hạng 3 = 60đ ·
              hạng 4 = 40đ.
              <br />
              Mỗi thử thách không hoàn thành =
              <b className="text-red-400">
                {' '}-10đ
              </b>.
            </p>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-sm">

                <thead>

                  <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-slate-500">

                    <th className="p-3 text-left">
                      Đội chơi
                    </th>

                    <th className="p-3 text-center">
                      Tổng điểm
                    </th>

                    <th className="p-3 text-center">
                      Điểm trừ
                    </th>

                    <th className="p-3 text-center">
                      Số điểm còn lại
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {results.map(
                    (result, index) => (

                      <tr
                        key={
                          result.teamId
                        }
                        className="border-b border-white/10"
                      >

                        <td className="p-3">

                          <div className="flex items-center gap-2">

                            <span className="font-black text-slate-500 w-5">
                              {index + 1}
                            </span>

                            <span>
                              {result.icon}
                            </span>

                            <span
                              className="font-bold"
                              style={{
                                color:
                                  result.color,
                              }}
                            >
                              {result.name}
                            </span>

                          </div>

                          <div className="text-[11px] text-slate-500 ml-7 mt-1">

                            {result.finished
                              ? `Về đích hạng ${result.finishRank}`
                              : 'Chưa về đích'}

                            {' · '}

                            {result.totalChallengesDone}
                            /
                            {result.totalChallenges}

                            {' thử thách hoàn thành'}

                          </div>

                        </td>

                        {/* BASE POINTS */}

                        <td className="p-3 text-center">

                          <span className="font-black text-lg">
                            {result.basePoints}
                          </span>

                          <span className="text-xs text-slate-500">
                            đ
                          </span>

                        </td>

                        {/* PENALTY */}

                        <td className="p-3 text-center">

                          <span className="font-black text-red-400 text-lg">
                            {result.penalty}
                          </span>

                          <span className="text-xs text-red-400">
                            đ
                          </span>

                        </td>

                        {/* FINAL */}

                        <td className="p-3 text-center">

                          <span className="font-black text-xl text-amber-300">
                            {result.finalScore}
                          </span>

                          <span className="text-xs text-slate-400">
                            đ
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* PENALTY EXPLANATION */}

            <div className="mt-5 rounded-xl bg-red-500/10 border border-red-400/20 p-4 text-xs text-slate-300">

              <b className="text-red-400">
                Quy tắc điểm trừ:
              </b>{' '}
              Mỗi thử thách không hoàn thành bị
              trừ 10 điểm.

              <br />

              Ví dụ một đội không hoàn thành
              5 thử thách thì điểm trừ là
              <b className="text-red-400">
                {' '}-50 điểm
              </b>.

            </div>

            <button
              className="mt-5 w-full rounded-xl py-3 bg-white/10 hover:bg-white/15"
              onClick={() =>
                setShowResults(false)
              }
            >
              Đóng
            </button>

          </div>

        </div>

      )}

    </main>
  );
}
