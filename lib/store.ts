'use client';

import { useEffect, useState } from 'react';
import { AppState } from './types';
import { INITIAL } from './data';
import { supabase } from './supabaseClient';

const KEY = 'banacode-live-state';

const clone = <T,>(x: T): T =>
  JSON.parse(JSON.stringify(x));

/**
 * Đọc state từ Supabase.
 * Nếu Supabase chưa có dữ liệu thì tạo state ban đầu.
 * Nếu Supabase không khả dụng thì dùng localStorage làm fallback.
 */
export async function load(): Promise<AppState> {
  // Nếu chưa có Supabase thì dùng localStorage
  if (!supabase) {
    if (typeof window === 'undefined') {
      return clone(INITIAL);
    }

    try {
      return JSON.parse(
        localStorage.getItem(KEY) || 'null'
      ) || clone(INITIAL);
    } catch {
      return clone(INITIAL);
    }
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 'live')
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Chưa có dữ liệu → tạo state ban đầu
    if (!data) {
      const initial = clone(INITIAL);

      const { error: insertError } = await supabase
        .from('app_state')
        .insert({
          id: 'live',
          data: initial
        });

      if (insertError) {
        throw insertError;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(KEY, JSON.stringify(initial));
      }

      return initial;
    }

    const state = data.data as AppState;

    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(state));
    }

    return state;
  } catch (error) {
    console.error('Supabase load error:', error);

    // Fallback về localStorage nếu Supabase gặp vấn đề
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(
          localStorage.getItem(KEY) || 'null'
        ) || clone(INITIAL);
      } catch {
        return clone(INITIAL);
      }
    }

    return clone(INITIAL);
  }
}

/**
 * Lưu toàn bộ state lên Supabase.
 */
export async function saveAll(next: AppState): Promise<AppState> {
  // Luôn lưu local trước để có fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  // Nếu chưa cấu hình Supabase thì chỉ lưu local
  if (!supabase) {
    return next;
  }

  const { error } = await supabase
    .from('app_state')
    .upsert(
      {
        id: 'live',
        data: next,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id'
      }
    );

  if (error) {
    console.error('Supabase save error:', error);
    throw error;
  }

  return next;
}

/**
 * Reset toàn bộ dữ liệu về trạng thái ban đầu.
 */
export async function reset(): Promise<AppState> {
  const initial = clone(INITIAL);
  await saveAll(initial);
  return initial;
}

/**
 * Theo dõi state realtime từ Supabase.
 */
export function useLiveState() {
  const [state, setState] = useState<AppState>(
    clone(INITIAL)
  );

  useEffect(() => {
    let mounted = true;

    // Tải dữ liệu hiện tại
    load().then((loaded) => {
      if (mounted) {
        setState(loaded);
      }
    });

    // Nếu chưa có Supabase thì không đăng ký realtime
    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    // Kết nối Supabase Realtime
    const channel = supabase
      .channel('banacode-live-state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: 'id=eq.live'
        },
        (payload) => {
          if (!mounted) return;

          if (payload.new && 'data' in payload.new) {
            const nextState = (
              payload.new as { data: AppState }
            ).data;

            setState(nextState);

            if (typeof window !== 'undefined') {
              localStorage.setItem(
                KEY,
                JSON.stringify(nextState)
              );
            }
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
