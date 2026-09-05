'use client';
import {useEffect,useState} from 'react';
import {AppState} from './types';
import {INITIAL} from './data';

const KEY='banacode-live-state';
const CH='banacode-live-channel';
const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));

export function load():AppState{
  if(typeof window==='undefined') return clone(INITIAL);
  try{ return JSON.parse(localStorage.getItem(KEY)||'null') || clone(INITIAL); }
  catch{ return clone(INITIAL); }
}

function broadcast(s:AppState){
  try{ new BroadcastChannel(CH).postMessage(s); }catch{}
}

// Ghi đè toàn bộ state 1 lần (dùng cho nút "Lưu" ở Admin).
export function saveAll(next:AppState){
  localStorage.setItem(KEY, JSON.stringify(next));
  broadcast(next);
  return next;
}

export function reset(){
  return saveAll(clone(INITIAL));
}

export function useLiveState(){
  const [state,setState]=useState<AppState>(INITIAL);
  useEffect(()=>{
    setState(load());
    const bc=new BroadcastChannel(CH);
    bc.onmessage=e=>setState(e.data);
    const onStorage=()=>setState(load());
    window.addEventListener('storage',onStorage);
    return ()=>{ bc.close(); window.removeEventListener('storage',onStorage); };
  },[]);
  return state;
}
