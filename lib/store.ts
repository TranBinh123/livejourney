'use client';

import { useEffect, useState } from 'react';

import { AppState } from './types';
import { INITIAL } from './data';
import { supabase } from './supabaseClient';

// ======================================================
// HELPERS
// ======================================================

const clone = <T,>(x: T): T =>
  JSON.parse(JSON.stringify(x));

const ROW_ID = 1;

// ======================================================
// LOAD
// ======================================================

/**
 * Đọc AppState hiện tại từ Supabase.
 *
 * Nếu Supabase chưa được cấu hình:
 * → sử dụng INITIAL.
 *
 * Nếu bảng app_state chưa có bản ghi id = 1:
 * → sử dụng INITIAL.
 *
 * Nếu Supabase có lỗi:
 * → throw error để phía Admin biết việc tải dữ liệu thất bại,
 *   tránh vô tình ghi đè dữ liệu thật bằng INITIAL.
 */
export async function load(): Promise<AppState> {
  const client = supabase;

  // Không có Supabase → chạy local bằng INITIAL
  if (!client) {
    console.warn(
      'Supabase chưa được cấu hình. Sử dụng INITIAL.'
    );

    return clone(INITIAL);
  }

  const { data, error } = await client
    .from('app_state')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle();

  if (error) {
    console.error(
      'Không thể tải AppState từ Supabase:',
      error
    );

    throw error;
  }

  // Chưa có dữ liệu trên Supabase
  if (!data?.data) {
    console.warn(
      'Chưa có AppState trên Supabase. Sử dụng INITIAL.'
    );

    return clone(INITIAL);
  }

  return clone(data.data as AppState);
}

// ======================================================
// SAVE
// ======================================================

/**
 * Lưu toàn bộ AppState xuống Supabase.
 *
 * Nếu lưu thất bại → throw error.
 * Không âm thầm coi như đã lưu thành công.
 */
export async function saveAll(
  next: AppState
): Promise<AppState> {
  const client = supabase;

  if (!client) {
    console.error(
      'Supabase chưa được cấu hình.'
    );

    throw new Error(
      'Supabase chưa được cấu hình.'
    );
  }

  const payload = clone(next);

  const { error } = await client
    .from('app_state')
    .upsert({
      id: ROW_ID,
      data: payload,
    });

  if (error) {
    console.error(
      'Không thể lưu AppState:',
      error
    );

    throw error;
  }

  return payload;
}

// ======================================================
// RESET
// ======================================================

/**
 * Reset toàn bộ chương trình về trạng thái INITIAL.
 */
export async function reset(): Promise<AppState> {
  const next = clone(INITIAL);

  await saveAll(next);

  return next;
}

// ======================================================
// REALTIME STATE
// ======================================================

/**
 * Hook dùng cho Public Screen và các màn hình cần
 * theo dõi AppState realtime từ Supabase.
 */
export function useLiveState(): AppState {
  const [state, setState] =
    useState<AppState>(
      clone(INITIAL)
    );

  useEffect(() => {
    let mounted = true;

    const client = supabase;

    // ==================================================
    // NO SUPABASE
    // ==================================================

    if (!client) {
      console.warn(
        'Supabase chưa được cấu hình.'
      );

      return () => {
        mounted = false;
      };
    }

    // ==================================================
    // INITIAL FETCH
    // ==================================================

    const fetchState = async () => {
      const { data, error } = await client
        .from('app_state')
        .select('data')
        .eq('id', ROW_ID)
        .maybeSingle();

      if (error) {
        console.error(
          'Không thể đọc AppState:',
          error
        );

        return;
      }

      if (
        mounted &&
        data?.data
      ) {
        setState(
          clone(data.data as AppState)
        );
      }
    };

    fetchState();

    // ==================================================
    // REALTIME
    // ==================================================

    const channel = client
      .channel(
        `app-state-realtime-${ROW_ID}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: `id=eq.${ROW_ID}`,
        },
        (payload) => {
          if (!mounted) return;

          const newData =
            payload.new as {
              data?: AppState;
            };

          if (newData?.data) {
            setState(
              clone(
                newData.data
              )
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            'Supabase Realtime: đã kết nối AppState.'
          );
        }

        if (status === 'CHANNEL_ERROR') {
          console.error(
            'Supabase Realtime: không thể kết nối channel AppState.'
          );
        }
      });

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      mounted = false;

      client.removeChannel(
        channel
      );
    };
  }, []);

  return state;
}
