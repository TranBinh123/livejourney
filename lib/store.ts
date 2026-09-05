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
 *
 * Nếu Supabase chưa được cấu hình:
 * → sử dụng localStorage làm fallback.
 *
 * Nếu Supabase đã được cấu hình:
 * → đọc dữ liệu từ bảng app_state, id = live.
 */
export async function load(): Promise<AppState> {
  // --------------------------------------------------
  // FALLBACK: LOCALSTORAGE
  // --------------------------------------------------
  if (!supabase) {
    if (typeof window === 'undefined') {
      return clone(INITIAL);
    }

    try {
      return (
        JSON.parse(
          localStorage.getItem(KEY) || 'null'
        ) || clone(INITIAL)
      );
    } catch {
      return clone(INITIAL);
    }
  }

  // --------------------------------------------------
  // SUPABASE
  // --------------------------------------------------
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 'live')
      .maybeSingle();

    if (error) {
      throw error;
    }

    // ------------------------------------------------
    // CHƯA CÓ DỮ LIỆU → TẠO STATE BAN ĐẦU
    // ------------------------------------------------
    if (!data) {
      const initial = clone(INITIAL);

      const { error: insertError } = await supabase
        .from('app_state')
        .insert({
          id: 'live',
          data: initial,
        });

      if (insertError) {
        throw insertError;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          KEY,
          JSON.stringify(initial)
        );
      }

      return initial;
    }

    // ------------------------------------------------
    // ĐÃ CÓ DỮ LIỆU
    // ------------------------------------------------
    const state = data.data as AppState;

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        KEY,
        JSON.stringify(state)
      );
    }

    return state;
  } catch (error) {
    console.error(
      'Supabase load error:',
      error
    );

    // ------------------------------------------------
    // FALLBACK VỀ LOCALSTORAGE
    // ------------------------------------------------
    if (typeof window !== 'undefined') {
      try {
        return (
          JSON.parse(
            localStorage.getItem(KEY) || 'null'
          ) || clone(INITIAL)
        );
      } catch {
        return clone(INITIAL);
      }
    }

    return clone(INITIAL);
  }
}

/**
 * Lưu toàn bộ state.
 *
 * 1. Lưu localStorage trước.
 * 2. Nếu có Supabase → lưu lên Supabase.
 */
export async function saveAll(
  next: AppState
): Promise<AppState> {
  // --------------------------------------------------
  // LOCAL STORAGE
  // --------------------------------------------------
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      KEY,
      JSON.stringify(next)
    );
  }

  // --------------------------------------------------
  // NẾU KHÔNG CÓ SUPABASE
  // --------------------------------------------------
  if (!supabase) {
    return next;
  }

  // --------------------------------------------------
  // LƯU SUPABASE
  // --------------------------------------------------
  const { error } = await supabase
    .from('app_state')
    .upsert(
      {
        id: 'live',
        data: next,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    console.error(
      'Supabase save error:',
      error
    );

    throw error;
  }

  return next;
}

/**
 * Reset toàn bộ dữ liệu
 * về trạng thái ban đầu.
 */
export async function reset(): Promise<AppState> {
  const initial = clone(INITIAL);

  await saveAll(initial);

  return initial;
}

/**
 * Theo dõi state realtime từ Supabase.
 *
 * Khi Admin lưu dữ liệu:
 *
 * Admin
 *   ↓
 * saveAll()
 *   ↓
 * Supabase app_state
 *   ↓
 * Realtime
 *   ↓
 * Public Screen
 */
export function useLiveState() {
  const [state, setState] = useState<AppState>(
    clone(INITIAL)
  );

  useEffect(() => {
    let mounted = true;

    // ------------------------------------------------
    // TẢI STATE BAN ĐẦU
    // ------------------------------------------------
    load()
      .then((loaded) => {
        if (mounted) {
          setState(loaded);
        }
      })
      .catch((error) => {
        console.error(
          'Initial state load error:',
          error
        );
      });

    // ------------------------------------------------
    // NẾU CHƯA CÓ SUPABASE
    // → CHỈ DÙNG LOCAL
    // ------------------------------------------------
    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    // ------------------------------------------------
    // QUAN TRỌNG:
    // Sau khi kiểm tra !supabase,
    // tạo một biến client riêng.
    //
    // TypeScript sẽ hiểu:
    // client KHÔNG phải null.
    // ------------------------------------------------
    const client = supabase;

    // ------------------------------------------------
    // TẠO REALTIME CHANNEL
    // ------------------------------------------------
    const channel = client
      .channel('banacode-live-state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: 'id=eq.live',
        },
        (payload) => {
          if (!mounted) {
            return;
          }

          // ------------------------------------------
          // NHẬN STATE MỚI TỪ SUPABASE
          // ------------------------------------------
          if (
            payload.new &&
            'data' in payload.new
          ) {
            const nextState = (
              payload.new as {
                data: AppState;
              }
            ).data;

            setState(nextState);

            // ----------------------------------------
            // CẬP NHẬT LOCAL CACHE
            // ----------------------------------------
            if (
              typeof window !== 'undefined'
            ) {
              localStorage.setItem(
                KEY,
                JSON.stringify(nextState)
              );
            }
          }
        }
      )
      .subscribe();

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------
    return () => {
      mounted = false;

      client.removeChannel(channel);
    };
  }, []);

  return state;
}
