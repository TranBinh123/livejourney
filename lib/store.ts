'use client';
import {useEffect,useState} from 'react';
import {AppState,TeamId} from './types';
import {INITIAL,CHECKPOINTS} from './data';
const KEY='banacode-live-state';const CH='banacode-live-channel';
const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export function load():AppState{if(typeof window==='undefined')return clone(INITIAL);try{return JSON.parse(localStorage.getItem(KEY)||'null')||clone(INITIAL)}catch{return clone(INITIAL)}}
function save(s:AppState){localStorage.setItem(KEY,JSON.stringify(s));try{new BroadcastChannel(CH).postMessage(s)}catch{}}
export function update(fn:(s:AppState)=>AppState){const s=load();const next=fn(clone(s));save(next);return next}
export function reset(){save(clone(INITIAL));return load()}
export function useLiveState(){const [state,setState]=useState<AppState>(INITIAL);useEffect(()=>{setState(load());const bc=new BroadcastChannel(CH);bc.onmessage=e=>setState(e.data);const on=()=>setState(load());window.addEventListener('storage',on);return()=>{bc.close();window.removeEventListener('storage',on)}},[]);return state}
export function completeChallenge(team:TeamId,cp:number,n:number){return update(s=>{const t=s.teams[team];t.completedChallenges[cp]=n;return s})}
export function completeCheckpoint(team:TeamId){return update(s=>{const t=s.teams[team];const now=new Date().toISOString();t.completedAt[t.current]=now;if(t.current===CHECKPOINTS.length-1){t.finishedAt=now}else t.current+=1;return s})}
