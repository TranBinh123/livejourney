'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {CHECKPOINTS,TEAMS} from '@/lib/data';
import {load,saveAll,reset} from '@/lib/store';
import {AppState,TeamId} from '@/lib/types';

export default function AdminPanel(){
  const [draft,setDraft]=useState<AppState|null>(null);
  const [savedAt,setSavedAt]=useState<string|null>(null);

  useEffect(()=>{ setDraft(load()); },[]);

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
    }
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
          <button onClick={handleSave} className="text-sm font-bold bg-emerald-400 text-slate-950 rounded-lg px-4 py-2">
            💾 Lưu
          </button>
          <Link href="/" className="text-sm bg-white/10 rounded-lg px-4 py-2 flex items-center">
            Thoát
          </Link>
        </div>
      </header>

      {savedAt && <div className="mb-4 text-xs text-emerald-400">Đã lưu lúc {savedAt}</div>}

      <div className="glass rounded-2xl p-2 md:p-4 overflow-x-auto">
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
      </p>
    </main>
  );
}
