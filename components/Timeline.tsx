'use client';
import {CHECKPOINTS,TEAMS} from '@/lib/data';
import {AppState,TeamId} from '@/lib/types';

export default function Timeline({state,onTeam}:{state:AppState;onTeam:(id:TeamId)=>void}){
  return (
    <div className="relative pl-1">
      <div className="absolute left-[19px] top-3 bottom-3 w-[2px] timeline-line"/>
      <div className="flex flex-col gap-6">
        {CHECKPOINTS.map((c,i)=>{
          const isLastCp = i===CHECKPOINTS.length-1;
          const here = TEAMS.filter(t=>{
            const ts = state.teams[t.id];
            if(isLastCp) return !!ts.finishedAt || ts.current===c.id;
            return ts.current===c.id && !ts.finishedAt;
          });
          return (
            <div key={c.id} className="relative flex gap-3 items-start">
              <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full glass flex items-center justify-center text-base border ${i===0?'pulse':''}`}>
                {c.symbol}
              </div>
              <div className="flex-1 pt-1.5 min-w-0">
                <div className="text-[11px] uppercase tracking-[.15em] text-slate-300">{c.name}</div>
                {here.length>0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {here.map(t=>(
                      <button
                        key={t.id}
                        aria-label={t.name}
                        onClick={()=>onTeam(t.id)}
                        style={{borderColor:t.color,background:`${t.color}22`,boxShadow:`0 0 10px ${t.color}33`}}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0"
                      >
                        {t.icon}
                      </button>
                    ))}
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
