'use client';

import { useEffect, useState } from 'react';
import { AppState } from './types';
import { INITIAL } from './data';
import { supabase } from './supabaseClient';

const ROW_ID = 'main';

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value));

function mergeWithDefaults(data: Partial<AppState> | null): AppState {
  const base = clone(INITIAL);

  if (!data) return base;

  return {
    ...base,
    ...data,
    teams: {
      ...base.teams,
      ...(data.teams || {}),
    },
    round2Rules: data.round2Rules
      ? {
          ...base.round2Rules,
          ...data.round2Rules,
        }
      : base.round2Rules,
  };
}

// ======================================================
// LOAD
// ======================================================

export async function load(): Promise<AppState> {
  if (!supabase) {
    return clone(INITIAL);
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle();

    if (error) {
      console.error('Supabase load error:', error);
      return clone(INITIAL);
    }

    return mergeWithDefaults(data?.data || null);
  } catch (error) {
    console.error('Load state error:', error);
    return clone(INITIAL);
  }
}

// ======================================================
// SAVE
// ======================================================

export async function saveAll(next: AppState): Promise<AppState> {
  const state = mergeWithDefaults(next);

  if (!supabase) {
    return state;
  }

  const { error } = await supabase
    .from('app_state')
    .upsert(
      {
        id: ROW_ID,
        data: state,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    console.error('Supabase save error:', error);
    throw error;
  }

  return state;
}

// ======================================================
// RESET
// ======================================================

export async function reset(): Promise<AppState> {
  const state = clone(INITIAL);
  return saveAll(state);
}

// ======================================================
// REALTIME STATE
// ======================================================

export function useLiveState(): AppState {
  const [state, setState] = useState<AppState>(
    clone(INITIAL)
  );

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      const loaded = await load();

      if (mounted) {
        setState(loaded);
      }
    }

    initialLoad();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const channel = supabase
      .channel('banacode-live-state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
        },
        (payload) => {
          const nextData =
            (payload.new as { data?: Partial<AppState> })?.data;

          if (nextData && mounted) {
            setState(mergeWithDefaults(nextData));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
}
