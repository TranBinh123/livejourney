'use client';
import {CHECKPOINTS,TEAMS} from '@/lib/data';
import {AppState,TeamId} from '@/lib/types';

const PER_ROW = 2;

export default function Timeline({state,onTeam}:{state:AppState;onTeam:(id:TeamId)=>void}){
  const rows:number[][]=[];
  for(let i=0;i<CHECKPOINTS.length;i+=PER_ROW) rows.push(CHECKPOINTS.slice(i,i+PER_ROW).map(c=>c.id));

  return (
    <div className="py-2 px-1">
      {rows.map((row,ri)=>{
        const reverse = ri%2===1;
        const isLastRow = ri===rows.length-1;
        return (
          <div key={ri}>
            <div className={`flex ${reverse?'flex-row-reverse':'flex-row'} items-start justify-between gap-2`}>
              {row.map(cpId=>{
                const c = CHECKPOINTS[cpId];
                const isLastCp = cpId===CHECKPOINTS.length-1;
                const here = TEAMS.filter(t=>{
                  const ts = state.teams[t.id];
                  if(isLastCp) return !!ts.finishedAt || ts.current===cpId;
                  return ts.current===cpId && !ts.finishedAt;
                });
                return (
                  <div key={c.id} className="flex flex-col items-center w-[47%]">
                    <div className={`w-8 h-8 rounded-full glass flex items-center justify-center text-sm border ${cpId===0?'pulse':''}`}>{c.symbol}</div>
                    <div className="mt-1 text-[8px] md:text-[9px] uppercase tracking-[.12em] text-center text-slate-300 leading-tight px-1">{c.name}</div>
                    {here.length>0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-2 max-w-[130px]">
                        {here.map(t=>(
                          <button
                            key={t.id}
                            aria-label={t.name}
                            onClick={()=>onTeam(t.id)}
                            style={{borderColor:t.color,background:`${t.color}22`,boxShadow:`0 0 10px ${t.color}33`}}
                            className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0"
                          >
                            {t.icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!isLastRow && (
              <div className={`flex ${reverse?'justify-start':'justify-end'} px-[18%]`}>
                <div className="w-[2px] h-4 bg-gradient-to-b from-amber-300/60 to-amber-300/10 rounded-full"/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
