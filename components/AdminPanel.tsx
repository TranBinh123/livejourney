'use client';
import {useEffect,useState,FormEvent} from 'react';
import Link from 'next/link';
import {CHECKPOINTS,TEAMS} from '@/lib/data';
import {load,saveAll,reset} from '@/lib/store';
import {AppState,TeamId} from '@/lib/types';
import {ADMIN_PASSWORD,isAdminAuthed,setAdminAuthed} from '@/lib/auth';
import {computeFinalScores,TeamScoreResult} from '@/lib/scoring';

export default function AdminPanel(){
  const [authed,setAuthed]=useState<boolean|null>(null);
  const [pwInput,setPwInput]=useState('');
  const [pwError,setPwError]=useState(false);

  const [draft,setDraft]=useState<AppState|null>(null);
  const [savedAt,setSavedAt]=useState<string|null>(null);
  const [results,setResults]=useState<TeamScoreResult[]|null>(null);
  const [showResults,setShowResults]=useState(false);

  useEffect(()=>{ setAuthed(isAdminAuthed()); },[]);
  useEffect(()=>{ setDraft(load()); },[]);

  const handleLogin=(e:FormEvent)=>{
    e.preventDefault();
    if(pwInput===ADMIN_PASSWORD){
      setAdminAuthed();
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  if(authed===null){
    return <main className="min-h-screen flex items-center justify-center text-slate-400">Đang tải...</main>;
  }

  if(!authed){
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="glass rounded-2xl p-6 w-full max-w-sm">
          <div className="text-xs tracking-[.3em] text-amber-300">THE BANACODE / ADMIN</div>
          <h1 className="text-xl font-black mt-1 mb-5">Đăng nhập quản trị</h1>

          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Mật khẩu</label>
          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={e=>{ setPwInput(e.target.value); setPwError(false); }}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm"
            placeholder="Nhập mật khẩu"
          />
          {pwError && <div className="text-xs text-red-400 mt-2">Sai mật khẩu, vui lòng thử lại.</div>}

          <button type="submit" className="w-full mt-4 text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2.5">
            Vào trang quản trị
          </button>
          <Link href="/" className="block text-center text-xs text-slate-400 hover:text-slate-200 mt-4">
            ← Quay lại màn hình chính
          </Link>
        </form>
      </main>
    );
  }

  if(!draft){
    return <main className="min-h-screen flex items-center justify-center text-slate-400">Đang tải...</main>;
  }

  const setLocation=(team:TeamId,cp:number)=>{
    setDraft(d=>{
      if(!d) return d;
      const next:AppState=JSON.parse(JSON.stringify(d));
      next.teams[team].current=cp;
      return next;
    });
    setSavedAt(null);
  };

  const toggleChallenge=(team:TeamId,cp:number,slot:number,value:boolean)=>{
    setDraft(d=>{
      if(!d) return d;
      const next:AppState=JSON.parse(JSON.stringify(d));
      const t=next.teams[team];
      const arr=t.challengesDone[cp]?[...t.challengesDone[cp]]:[false,false];
      arr[slot]=value;
      t.challengesDone[cp]=arr;
      return next;
    });
    setSavedAt(null);
  };

  const toggleComplete=(team:TeamId,cp:number,value:boolean)=>{
    setDraft(d=>{
      if(!d) return d;
      const next:AppState=JSON.parse(JSON.stringify(d));
      const t=next.teams[team];
      if(value){
        const now=new Date().toISOString();
        t.completedAt[cp]=now;
        if(cp===CHECKPOINTS.length-1) t.finishedAt=now;
      } else {
        delete t.completedAt[cp];
        if(cp===CHECKPOINTS.length-1) delete t.finishedAt;
      }
      return next;
    });
    setSavedAt(null);
  };

  const handleSave=()=>{
    saveAll(draft);
    setSavedAt(new Date().toLocaleTimeString('vi-VN'));
  };

  const handleReset=()=>{
    if(confirm('Reset toàn bộ dữ liệu demo?')){
      setDraft(reset());
      setSavedAt(null);
      setResults(null);
      setShowResults(false);
    }
  };

  const handleTally=()=>{
    if(!draft) return;
    setResults(computeFinalScores(draft));
    setShowResults(true);
  };

  return (
    <main className="min-h-screen p-3 md:p-8">
      <header className="flex flex-wrap gap-3 justify-between items-center mb-5">
        <div>
          <div className="text-xs tracking-[.3em] text-amber-300">THE BANACODE / ADMIN</div>
          <h1 className="text-2xl md:text-3xl font-black">LIVE CONTROL</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReset} className="text-xs text-red-300 border border-red-400/30 rounded-lg px-3 py-2">
            Reset demo
          </button>
          <button onClick={handleTally} className="text-sm font-bold bg-amber-400 text-slate-950 rounded-lg px-4 py-2">
            📊 Tổng hợp điểm
          </button>
          <button onClick={handleSave} className="text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2">
            💾 Lưu
          </button>
          <Link href="/" className="text-sm bg-white/10 rounded-lg px-4 py-2 flex items-center">
            Thoát
          </Link>
        </div>
      </header>

      {savedAt && <div className="mb-4 text-xs text-emerald-400">Đã lưu lúc {savedAt}</div>}

      {/* Mobile: dạng thẻ xếp dọc — xem đầy đủ không cần kéo ngang */}
      <div className="md:hidden space-y-3">
        {TEAMS.map(t=>{
          const ts=draft.teams[t.id];
          const cp=CHECKPOINTS[ts.current];
          const doneArr=ts.challengesDone[ts.current]||[false,false];
          const isComplete=!!ts.completedAt[ts.current];
          return (
            <div key={t.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>{t.icon}</span>
                <span className="font-semibold" style={{color:t.color}}>{t.name}</span>
              </div>

              <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-1">Địa điểm</label>
              <select
                value={ts.current}
                onChange={e=>setLocation(t.id,Number(e.target.value))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
              >
                {CHECKPOINTS.map(c=>(
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {cp.challenges>0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-1">
                  {cp.challenges>=1 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[0]}
                        onChange={e=>toggleChallenge(t.id,ts.current,0,e.target.checked)}
                      />
                      Thử thách 1
                    </label>
                  )}
                  {cp.challenges>=2 && (
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500"
                        checked={!!doneArr[1]}
                        onChange={e=>toggleChallenge(t.id,ts.current,1,e.target.checked)}
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
                  onChange={e=>toggleComplete(t.id,ts.current,e.target.checked)}
                />
                <span className="font-semibold">Hoàn thành địa điểm</span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Desktop / tablet: bảng đầy đủ */}
      <div className="hidden md:block glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
              <th className="p-3">Đội chơi</th>
              <th className="p-3">Địa điểm</th>
              <th className="p-3 text-center">Thử thách 1</th>
              <th className="p-3 text-center">Thử thách 2</th>
              <th className="p-3 text-center">Hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t=>{
              const ts=draft.teams[t.id];
              const cp=CHECKPOINTS[ts.current];
              const doneArr=ts.challengesDone[ts.current]||[false,false];
              const isComplete=!!ts.completedAt[ts.current];
              return (
                <tr key={t.id} className="border-t border-white/10">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span className="font-semibold" style={{color:t.color}}>{t.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={ts.current}
                      onChange={e=>setLocation(t.id,Number(e.target.value))}
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm max-w-[180px]"
                    >
                      {CHECKPOINTS.map(c=>(
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    {cp.challenges>=1 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[0]}
                        onChange={e=>toggleChallenge(t.id,ts.current,0,e.target.checked)}
                      />
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-3 text-center">
                    {cp.challenges>=2 ? (
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-emerald-500"
                        checked={!!doneArr[1]}
                        onChange={e=>toggleChallenge(t.id,ts.current,1,e.target.checked)}
                      />
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-amber-400"
                      checked={isComplete}
                      onChange={e=>toggleComplete(t.id,ts.current,e.target.checked)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Chọn <b>Địa điểm</b> đội đang đứng → tick <b>Thử thách 1 / 2</b> nếu đã hoàn thành thử thách tại đó
        → tick <b>Hoàn thành</b> để đánh dấu đội đã xong địa điểm này. Có thể tick 1, 2 hoặc cả các cột tuỳ trạng thái thực tế.
        Nhớ bấm <b>Lưu</b> để cập nhật lên màn hình chính — mọi thay đổi chưa lưu sẽ không hiển thị public.
        Khi chương trình kết thúc, bấm <b>📊 Tổng hợp điểm</b> để tính điểm về đích (100/80/60/40) và áp dụng
        phạt −10 cho đội không hoàn thành thử thách nào trong suốt hành trình.
      </p>

      {showResults && results && (
        <div className="fixed inset-0 bg-black/65 flex items-end md:items-center justify-center p-4 z-50" onClick={()=>setShowResults(false)}>
          <div className="glass rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="text-xs tracking-[.3em] text-amber-300">TỔNG HỢP ĐIỂM</div>
            <h2 className="text-xl font-black mb-4">KẾT QUẢ CHUNG CUỘC</h2>

            <div className="space-y-3">
              {results.map((r,i)=>(
                <div key={r.teamId} className="rounded-xl bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 font-bold w-4 shrink-0">{i+1}</span>
                      <span className="shrink-0">{r.icon}</span>
                      <span className="font-semibold truncate" style={{color:r.color}}>{r.name}</span>
                    </div>
                    <span className="text-lg font-black shrink-0">{r.finalScore}đ</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 pl-6">
                    {r.finished ? `Về đích hạng ${r.finishRank} (+${r.basePoints}đ)` : 'Chưa về đích (+0đ)'}
                    {r.penalty!==0 && <span className="text-red-400"> · Phạt {r.penalty}đ (0 thử thách hoàn thành)</span>}
                    {' · '}{r.totalChallengesDone} thử thách đã hoàn thành
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full rounded-xl py-3 bg-white/10" onClick={()=>setShowResults(false)}>Đóng</button>
          </div>
        </div>
      )}
    </main>
  );
}
