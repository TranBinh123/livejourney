'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';

import { CHECKPOINTS, TEAMS } from '@/lib/data';
import { load, saveAll, reset } from '@/lib/store';
import { AppState, TeamId } from '@/lib/types';
import {
  ADMIN_PASSWORD,
  isAdminAuthed,
  setAdminAuthed,
} from '@/lib/auth';
import {
  computeFinalScores,
  TeamScoreResult,
} from '@/lib/scoring';

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const [draft, setDraft] = useState<AppState | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [results, setResults] = useState<TeamScoreResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --------------------------------------------------
  // KIỂM TRA ĐĂNG NHẬP ADMIN
  // --------------------------------------------------
  useEffect(() => {
    setAuthed(isAdminAuthed());
  }, []);

  // --------------------------------------------------
  // TẢI DỮ LIỆU TỪ SUPABASE
  // --------------------------------------------------
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoadingData(true);

        const data = await load();

        if (active) {
          setDraft(data);
        }
      } catch (error) {
        console.error('Load data error:', error);

        if (active) {
          setSaveError(
            'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối Supabase.'
          );
        }
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // ĐĂNG NHẬP
  // --------------------------------------------------
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

  // --------------------------------------------------
  // ĐANG KIỂM TRA LOGIN
  // --------------------------------------------------
  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải...
      </main>
    );
  }

  // --------------------------------------------------
  // CHƯA ĐĂNG NHẬP
  // --------------------------------------------------
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

  // --------------------------------------------------
  // ĐANG TẢI DỮ LIỆU
  // --------------------------------------------------
  if (loadingData || !draft) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="text-lg">Đang tải dữ liệu...</div>
        <div className="text-xs text-slate-600">
          Đang kết nối với hệ thống điều khiển
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ĐỔI VỊ TRÍ ĐỘI
  // --------------------------------------------------
  const setLocation = (team: TeamId, cp: number) => {
    setDraft((current) => {
      if (!current) return current;

      const next: AppState = JSON.parse(
        JSON.stringify(current)
      );

      next.teams[team].current = cp;

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

  // --------------------------------------------------
  // TICK / BỎ TICK THỬ THÁCH
  //
  // TC1 và TC2 HOÀN TOÀN ĐỘC LẬP.
  // --------------------------------------------------
  const toggleChallenge = (
    team: TeamId,
    cp: number,
    slot: number,
    value: boolean
  ) => {
    setDraft((current) => {
      if (!current) return current;

      const next: AppState = JSON.parse(
        JSON.stringify(current)
      );

      const teamState = next.teams[team];

      const arr = teamState.challengesDone[cp]
        ? [...teamState.challengesDone[cp]]
        : [false, false];

      arr[slot] = value;

      teamState.challengesDone[cp] = arr;

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

  // --------------------------------------------------
  // HOÀN THÀNH ĐỊA ĐIỂM
  //
  // QUAN TRỌNG:
  // Có thể Hoàn thành địa điểm dù TC1 / TC2 chưa xong.
  // --------------------------------------------------
  const toggleComplete = (
    team: TeamId,
    cp: number,
    value: boolean
  ) => {
    setDraft((current) => {
      if (!current) return current;

      const next: AppState = JSON.parse(
        JSON.stringify(current)
      );

      const teamState = next.teams[team];

      if (value) {
        const now = new Date().toISOString();

        teamState.completedAt[cp] = now;

        // Nếu đây là địa điểm cuối cùng → ghi nhận về đích
        if (cp === CHECKPOINTS.length - 1) {
          teamState.finishedAt = now;
        }
      } else {
        delete teamState.completedAt[cp];

        if (cp === CHECKPOINTS.length - 1) {
          delete teamState.finishedAt;
        }
      }

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

  // --------------------------------------------------
  // LƯU LÊN SUPABASE
  // --------------------------------------------------
  const handleSave = async () => {
    if (!draft || saving) return;

    try {
      setSaving(true);
      setSaveError(null);

      await saveAll(draft);

      setSavedAt(
        new Date().toLocaleTimeString('vi-VN')
      );
    } catch (error) {
      console.error('Save error:', error);

      setSaveError(
        'Không thể lưu dữ liệu lên Supabase. Vui lòng kiểm tra kết nối và thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------
  const handleReset = async () => {
    if (saving) return;

    const confirmed = window.confirm(
      'Reset toàn bộ dữ liệu demo? Hành động này sẽ đưa 4 đội về trạng thái ban đầu.'
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setSaveError(null);

      const next = await reset();

      setDraft(next);
      setSavedAt(null);
      setResults(null);
      setShowResults(false);
    } catch (error) {
      console.error('Reset error:', error);

      setSaveError(
        'Không thể reset dữ liệu trên Supabase.'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // TỔNG HỢP ĐIỂM
  // --------------------------------------------------
  const handleTally = () => {
    if (!draft) return;

    setResults(computeFinalScores(draft));
    setShowResults(true);
  };

  // --------------------------------------------------
  // GIAO DIỆN ADMIN
  // --------------------------------------------------
  return (
    <main className="min-h-screen p-3 md:p-8">
      {/* HEADER */}
      <header className="flex flex-wrap gap-3 justify-between items-center mb-5">
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
            disabled={saving}
            className="text-xs text-red-300 border border-red-400/30 rounded-lg px-3 py-2 disabled:opacity-50"
          >
            Reset demo
          </button>

          <button
            onClick={handleTally}
            disabled={saving}
            className="text-sm font-bold bg-amber-400 text-slate-950 rounded-lg px-4 py-2 disabled:opacity-50"
          >
            📊 Tổng hợp điểm
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
          </button>

          <Link
            href="/"
            className="text-sm bg-white/10 rounded-lg px-4 py-2 flex items-center"
          >
            Thoát
          </Link>
        </div>
      </header>

      {/* TRẠNG THÁI LƯU */}
      {savedAt && !saveError && (
        <div className="mb-4 text-xs text-emerald-400">
          ✓ Đã lưu lúc {savedAt}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          ⚠️ {saveError}
        </div>
      )}

      {/* ==================================================
          MOBILE
          ================================================== */}
      <div className="md:hidden space-y-3">
        {TEAMS.map((team) => {
          const teamState = draft.teams[team.id];
          const checkpoint =
            CHECKPOINTS[teamState.current];

          const doneArr =
            teamState.challengesDone[
              teamState.current
            ] || [false, false];

          const isComplete =
            !!teamState.completedAt[
              teamState.current
            ];

          return (
            <div
              key={team.id}
              className="glass rounded-2xl p-4"
            >
              {/* TEAM */}
              <div className="flex items-center gap-2 mb-3">
                <span>{team.icon}</span>

                <span
                  className="font-semibold"
                  style={{ color: team.color }}
                >
                  {team.name}
                </span>
              </div>

              {/* LOCATION */}
              <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-1">
                Địa điểm
              </label>

              <select
                value={teamState.current}
                onChange={(e) =>
                  setLocation(
                    team.id,
                    Number(e.target.value)
                  )
                }
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
              >
                {CHECKPOINTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* CHALLENGES */}
              {checkpoint.challenges > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-1">
                  {checkpoint.challenges >= 1 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[0]}
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

                  {checkpoint.challenges >= 2 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[1]}
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
              <label className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-white/10">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-amber-400"
                  checked={isComplete}
                  onChange={(e) =>
                    toggleComplete(
                      team.id,
                      teamState.current,
                      e.target.checked
                    )
                  }
                />

                <span className="font-semibold">
                  Hoàn thành địa điểm
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          DESKTOP / TABLET
          ================================================== */}
      <div className="hidden md:block glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
              <th className="p-3">Đội chơi</th>
              <th className="p-3">Địa điểm</th>
              <th className="p-3 text-center">
                Thử thách 1
              </th>
              <th className="p-3 text-center">
                Thử thách 2
              </th>
              <th className="p-3 text-center">
                Hoàn thành
              </th>
            </tr>
          </thead>

          <tbody>
            {TEAMS.map((team) => {
              const teamState = draft.teams[team.id];

              const checkpoint =
                CHECKPOINTS[teamState.current];

              const doneArr =
                teamState.challengesDone[
                  teamState.current
                ] || [false, false];

              const isComplete =
                !!teamState.completedAt[
                  teamState.current
                ];

              return (
                <tr
                  key={team.id}
                  className="border-t border-white/10"
                >
                  {/* TEAM */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{team.icon}</span>

                      <span
                        className="font-semibold"
                        style={{ color: team.color }}
                      >
                        {team.name}
                      </span>
                    </div>
                  </td>

                  {/* LOCATION */}
                  <td className="p-3">
                    <select
                      value={teamState.current}
                      onChange={(e) =>
                        setLocation(
                          team.id,
                          Number(e.target.value)
                        )
                      }
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm max-w-[180px]"
                    >
                      {CHECKPOINTS.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* TC1 */}
                  <td className="p-3 text-center">
                    {checkpoint.challenges >= 1 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[0]}
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

                  {/* TC2 */}
                  <td className="p-3 text-center">
                    {checkpoint.challenges >= 2 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[1]}
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
                      checked={isComplete}
                      onChange={(e) =>
                        toggleComplete(
                          team.id,
                          teamState.current,
                          e.target.checked
                        )
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ==================================================
          HƯỚNG DẪN
          ================================================== */}
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Chọn <b>Địa điểm</b> đội đang đứng → tick{' '}
        <b>Thử thách 1 / 2</b> nếu đã hoàn thành thử
        thách tại đó → tick <b>Hoàn thành</b> để đánh
        dấu đội đã xong địa điểm này.
        Có thể tick 1, 2 hoặc cả các cột tùy trạng
        thái thực tế.
        <br />
        Nhớ bấm <b>Lưu</b> để cập nhật lên màn hình
        chính — mọi thay đổi chưa lưu sẽ không hiển
        thị public.
        <br />
        Khi chương trình kết thúc, bấm{' '}
        <b>📊 Tổng hợp điểm</b> để tính điểm về đích
        (100/80/60/40) và áp dụng phạt −10 cho đội
        không hoàn thành thử thách nào trong suốt
        hành trình.
      </p>

      {/* ==================================================
          KẾT QUẢ CHUNG CUỘC
          ================================================== */}
      {showResults && results && (
        <div
          className="fixed inset-0 bg-black/65 flex items-end md:items-center justify-center p-4 z-50"
          onClick={() => setShowResults(false)}
        >
          <div
            className="glass rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs tracking-[.3em] text-amber-300">
              TỔNG HỢP ĐIỂM
            </div>

            <h2 className="text-xl font-black mb-4">
              KẾT QUẢ CHUNG CUỘC
            </h2>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={result.teamId}
                  className="rounded-xl bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 font-bold w-4 shrink-0">
                        {index + 1}
                      </span>

                      <span className="shrink-0">
                        {result.icon}
                      </span>

                      <span
                        className="font-semibold truncate"
                        style={{ color: result.color }}
                      >
                        {result.name}
                      </span>
                    </div>

                    <span className="text-lg font-black shrink-0">
                      {result.finalScore}đ
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-1 pl-6">
                    {result.finished
                      ? `Về đích hạng ${result.finishRank} (+${result.basePoints}đ)`
                      : 'Chưa về đích (+0đ)'}

                    {result.penalty !== 0 && (
                      <span className="text-red-400">
                        {' '}
                        · Phạt {result.penalty}đ (0 thử
                        thách hoàn thành)
                      </span>
                    )}

                    {' · '}
                    {result.totalChallengesDone}{' '}
                    thử thách đã hoàn thành
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-6 w-full rounded-xl py-3 bg-white/10"
              onClick={() => setShowResults(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
