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
  const [results, setResults] =
    useState<TeamScoreResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(isAdminAuthed());
  }, []);

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

  const setLocation = (team: TeamId, cp: number) => {
    setDraft((d) => {
      if (!d) return d;

      const next: AppState = JSON.parse(
        JSON.stringify(d)
      );

      next.teams[team].current = cp;

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

  const toggleChallenge = (
    team: TeamId,
    cp: number,
    slot: number,
    value: boolean
  ) => {
    setDraft((d) => {
      if (!d) return d;

      const next: AppState = JSON.parse(
        JSON.stringify(d)
      );

      const t = next.teams[team];

      const arr = t.challengesDone[cp]
        ? [...t.challengesDone[cp]]
        : [false, false];

      arr[slot] = value;

      t.challengesDone[cp] = arr;

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

  const toggleComplete = (
    team: TeamId,
    cp: number,
    value: boolean
  ) => {
    setDraft((d) => {
      if (!d) return d;

      const next: AppState = JSON.parse(
        JSON.stringify(d)
      );

      const t = next.teams[team];

      if (value) {
        const now = new Date().toISOString();

        t.completedAt[cp] = now;

        if (cp === CHECKPOINTS.length - 1) {
          t.finishedAt = now;
        }
      } else {
        delete t.completedAt[cp];

        if (cp === CHECKPOINTS.length - 1) {
          delete t.finishedAt;
        }
      }

      return next;
    });

    setSavedAt(null);
    setSaveError(null);
  };

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

  const handleTally = () => {
    if (!draft) return;

    const calculatedResults =
      computeFinalScores(draft);

    setResults(calculatedResults);
    setShowResults(true);
  };

  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải...
      </main>
    );
  }

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

  if (loadingData || !draft) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải dữ liệu...
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 md:p-8">
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
            className="text-xs text-red-300 border border-red-400/30 rounded-lg px-3 py-2 disabled:opacity-40"
          >
            Reset demo
          </button>

          <button
            onClick={handleTally}
            disabled={saving}
            className="text-sm font-bold bg-amber-400 text-slate-950 rounded-lg px-4 py-2 disabled:opacity-40"
          >
            📊 Tổng hợp điểm
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2 disabled:opacity-40"
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

      {savedAt && (
        <div className="mb-4 text-xs text-emerald-400">
          Đã lưu lúc {savedAt}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {saveError}
        </div>
      )}

      {/* MOBILE */}
      <div className="md:hidden space-y-3">
        {TEAMS.map((t) => {
          const ts = draft.teams[t.id];
          const cp = CHECKPOINTS[ts.current];

          const doneArr =
            ts.challengesDone[ts.current] ||
            [false, false];

          const isComplete =
            !!ts.completedAt[ts.current];

          return (
            <div
              key={t.id}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span>{t.icon}</span>

                <span
                  className="font-semibold"
                  style={{ color: t.color }}
                >
                  {t.name}
                </span>
              </div>

              <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-1">
                Địa điểm
              </label>

              <select
                value={ts.current}
                onChange={(e) =>
                  setLocation(
                    t.id,
                    Number(e.target.value)
                  )
                }
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
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

              {cp.challenges > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-1">
                  {cp.challenges >= 1 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[0]}
                        onChange={(e) =>
                          toggleChallenge(
                            t.id,
                            ts.current,
                            0,
                            e.target.checked
                          )
                        }
                      />
                      Thử thách 1
                    </label>
                  )}

                  {cp.challenges >= 2 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[1]}
                        onChange={(e) =>
                          toggleChallenge(
                            t.id,
                            ts.current,
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

              <label className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-white/10">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-amber-400"
                  checked={isComplete}
                  onChange={(e) =>
                    toggleComplete(
                      t.id,
                      ts.current,
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

      {/* DESKTOP / TABLET */}
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
            {TEAMS.map((t) => {
              const ts = draft.teams[t.id];
              const cp = CHECKPOINTS[ts.current];

              const doneArr =
                ts.challengesDone[ts.current] ||
                [false, false];

              const isComplete =
                !!ts.completedAt[ts.current];

              return (
                <tr
                  key={t.id}
                  className="border-t border-white/10"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{t.icon}</span>

                      <span
                        className="font-semibold"
                        style={{ color: t.color }}
                      >
                        {t.name}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    <select
                      value={ts.current}
                      onChange={(e) =>
                        setLocation(
                          t.id,
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

                  <td className="p-3 text-center">
                    {cp.challenges >= 1 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[0]}
                        onChange={(e) =>
                          toggleChallenge(
                            t.id,
                            ts.current,
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

                  <td className="p-3 text-center">
                    {cp.challenges >= 2 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[1]}
                        onChange={(e) =>
                          toggleChallenge(
                            t.id,
                            ts.current,
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

                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-amber-400"
                      checked={isComplete}
                      onChange={(e) =>
                        toggleComplete(
                          t.id,
                          ts.current,
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

      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Chọn <b>Địa điểm</b> đội đang đứng → tick{' '}
        <b>Thử thách 1 / 2</b> nếu đã hoàn thành thử
        thách tại đó → tick <b>Hoàn thành</b> để đánh
        dấu đội đã xong địa điểm. Có thể tick 1, 2 hoặc
        cả các cột tuỳ trạng thái thực tế.
        <br />
        Nhớ bấm <b>Lưu</b> để cập nhật lên màn hình
        chính — mọi thay đổi chưa lưu sẽ không hiển thị
        public.
      </p>

      {/* ========================= */}
      {/* TỔNG HỢP ĐIỂM */}
      {/* ========================= */}

      {showResults && results && (
        <div
          className="fixed inset-0 bg-black/65 flex items-end md:items-center justify-center p-4 z-50"
          onClick={() => setShowResults(false)}
        >
          <div
            className="glass rounded-3xl p-5 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs tracking-[.3em] text-amber-300">
              TỔNG HỢP ĐIỂM
            </div>

            <h2 className="text-xl md:text-2xl font-black mb-5">
              KẾT QUẢ CHUNG CUỘC
            </h2>

            <div className="space-y-3">
              {results.map((r, i) => {
                const deduction =
                  r.penalty < 0
                    ? Math.abs(r.penalty)
                    : r.penalty;

                const remainingScore =
                  r.finalScore;

                return (
                  <div
                    key={r.teamId}
                    className="rounded-2xl bg-black/20 p-4"
                  >
                    {/* Tên đội + thứ hạng */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-slate-500 font-bold w-5 shrink-0">
                        {i + 1}
                      </span>

                      <span className="text-xl">
                        {r.icon}
                      </span>

                      <span
                        className="font-bold text-base md:text-lg truncate"
                        style={{ color: r.color }}
                      >
                        {r.name}
                      </span>
                    </div>

                    {/* 3 CỘT ĐIỂM */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {/* TỔNG ĐIỂM */}
                      <div className="rounded-xl bg-white/5 p-3 text-center">
                        <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Tổng điểm
                        </div>

                        <div className="text-xl md:text-2xl font-black text-white">
                          {r.basePoints}đ
                        </div>
                      </div>

                      {/* ĐIỂM TRỪ */}
                      <div className="rounded-xl bg-red-500/10 border border-red-400/10 p-3 text-center">
                        <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Điểm trừ
                        </div>

                        <div
                          className={`text-xl md:text-2xl font-black ${
                            deduction > 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {deduction > 0
                            ? `-${deduction}đ`
                            : '0đ'}
                        </div>
                      </div>

                      {/* SỐ ĐIỂM CÒN LẠI */}
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/10 p-3 text-center">
                        <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Số điểm còn lại
                        </div>

                        <div className="text-xl md:text-2xl font-black text-emerald-300">
                          {remainingScore}đ
                        </div>
                      </div>
                    </div>

                    {/* THÔNG TIN BỔ SUNG */}
                    <div className="text-xs text-slate-400 mt-3 pl-1">
                      {r.finished
                        ? `Về đích hạng ${r.finishRank}`
                        : 'Chưa về đích'}

                      {' · '}

                      {r.totalChallengesDone}{' '}
                      thử thách đã hoàn thành

                      {r.totalChallengesDone === 0 && (
                        <span className="text-red-400">
                          {' · Không hoàn thành thử thách → trừ 10 điểm'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GHI CHÚ LUẬT ĐIỂM */}
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400 leading-relaxed">
              <div className="font-semibold text-slate-300 mb-1">
                Quy tắc tính điểm
              </div>

              <div>
                • Hạng 1: <b>100 điểm</b>
              </div>

              <div>
                • Hạng 2: <b>80 điểm</b>
              </div>

              <div>
                • Hạng 3: <b>60 điểm</b>
              </div>

              <div>
                • Hạng 4: <b>40 điểm</b>
              </div>

              <div>
                • Nếu tổng số thử thách hoàn thành
                trong hành trình = <b>0</b> →{' '}
                <b className="text-red-400">
                  trừ 10 điểm
                </b>
              </div>
            </div>

            <button
              className="mt-5 w-full rounded-xl py-3 bg-white/10 hover:bg-white/15 transition"
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
