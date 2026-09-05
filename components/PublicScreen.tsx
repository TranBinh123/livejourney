'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Settings} from 'lucide-react';
import {TEAMS,CHECKPOINTS} from '@/lib/data';
import {useLiveState} from '@/lib/store';
import {TeamId} from '@/lib/types';
import Timeline from './Timeline';

export default function PublicScreen(){
  const state=useLiveState();
  const [selected,setSelected]=useState<TeamId|null>(null);
  const selectedTeam=selected?TEAMS.find(t=>t.id===selected):null;
  const ss=selected?state.teams[selected]:null;
  const cp=ss?CHECKPOINTS[ss.current]:null;
  const rank=TEAMS.map(t=>({t,at:state.teams[t.id].finishedAt}))
    .filter(x=>x.at)
    .sort((a,b)=>new Date(a.at!).getTime()-new Date(b.at!).getTime());

  return (
    <main className="min-h-screen grid-bg overflow-x-hidden">
      <header className="px-4 md:px-10 py-4 md:py-5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[9px] md:text-[10px] tracking-[.35em] text-amber-300">THE BANACODE</div>
          <h1 className="text-xl md:text-4xl font-black tracking-tight leading-tight">
            HÀNH TRÌNH <span className="text-amber-300">19 NĂM</span>
          </h1>
        </div>
        <Link href="/admin" aria-label="Admin" title="Quản trị" className="glass rounded-xl w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-300 shrink-0">
          <Settings size={18}/>
        </Link>
      </header>

      <section className="mx-3 md:mx-8 glass rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{background:'radial-gradient(circle at 50% 35%,rgba(246,200,95,.18),transparent 38%)'}}/>
        <div className="relative p-4 md:p-10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-[.3em] text-slate-400">HÀNH TRÌNH</p>
              <p className="text-slate-300 mt-1 text-sm">Theo dõi vị trí các đội theo thời gian thực</p>
            </div>
            <div className="text-right text-[10px] md:text-xs text-slate-400 shrink-0">
              LIVE <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1"/>
            </div>
          </div>
          <div className="mt-4">
            <Timeline state={state} onTeam={setSelected}/>
          </div>
        </div>
      </section>

      <section className="p-3 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {TEAMS.map(t=>{
          const s=state.teams[t.id];
          const c=CHECKPOINTS[s.current];
          return (
            <button key={t.id} onClick={()=>setSelected(t.id)} className="glass rounded-2xl p-3 md:p-4 text-left hover:translate-y-[-2px] transition">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl shrink-0" style={{background:t.color+'22',border:`1px solid ${t.color}66`}}>
                  {t.icon}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm md:text-base truncate" style={{color:t.color}}>{t.name}</div>
                  <div className="text-[11px] md:text-xs text-slate-400 truncate">{s.finishedAt?'FINISH':c.name}</div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {selectedTeam&&ss&&(
        <div className="fixed inset-0 bg-black/65 flex items-end md:items-center justify-center p-4 z-50" onClick={()=>setSelected(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{background:selectedTeam.color+'22'}}>
                {selectedTeam.icon}
              </div>
              <div>
                <h2 className="text-xl font-black" style={{color:selectedTeam.color}}>{selectedTeam.name.toUpperCase()}</h2>
                <div className="text-sm text-slate-400">{ss.finishedAt?'🏆 FINISH':`Vị trí: ${cp?.name}`}</div>
              </div>
            </div>

            {cp && (
              <div className="mt-5 p-4 rounded-2xl bg-black/20">
                <div className="text-xs uppercase tracking-widest text-slate-500">Tiến độ thử thách tại đây</div>
                <div className="mt-3 space-y-2">
                  {Array.from({length:cp.challenges}).map((_,i)=>{
                    const done = !!ss.challengesDone[ss.current]?.[i];
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span>Thử thách {i+1}</span>
                        <span className={done?'text-emerald-400':'text-slate-500'}>
                          {done?'✓ Hoàn thành':'✕ Chưa hoàn thành'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm">
              <span className="text-slate-400">Trạng thái:</span>{' '}
              {ss.finishedAt?'Đã hoàn thành hành trình':ss.completedAt[ss.current]?'Đã hoàn thành địa điểm':'Đang ở checkpoint'}
            </div>

            {Object.keys(ss.completedAt).length>0 && (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Lịch sử</div>
                <div className="max-h-36 overflow-auto space-y-1 text-xs text-slate-400">
                  {Object.entries(ss.completedAt).map(([k,v])=>(
                    <div key={k} className="flex justify-between">
                      <span>{CHECKPOINTS[Number(k)].name}</span>
                      <span>{new Date(v).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="mt-6 w-full rounded-xl py-3 bg-white/10" onClick={()=>setSelected(null)}>Đóng</button>
          </div>
        </div>
      )}

      {rank.length>0 && (
        <div className="mx-3 md:mx-8 mb-8 glass rounded-2xl p-4 md:p-5">
          <h3 className="font-black text-sm md:text-base">🏆 FINISH RANKING</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {rank.map((x,i)=>(
              <div key={x.t.id} className="rounded-xl bg-black/20 p-3 flex justify-between text-sm">
                <span>{['🥇','🥈','🥉','🏅'][i]} {x.t.name}</span>
                <b>{[100,80,60,40][i]}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
