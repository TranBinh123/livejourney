'use client';

import { useEffect, useState } from 'react';
import { AppState } from './types';
import { INITIAL } from './data';
import { supabase } from './supabaseClient';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const ROW_ID = 1;

export function load(): AppState {
  return clone(INITIAL);
}

export async function saveAll(next: AppState) {
  const client = supabase;

  if (!client) {
    console.error('Supabase chưa được cấu hình.');
    return next;
  }

  const { error } = await client
    .from('app_state')
    .upsert({
      id: ROW_ID,
      data: next,
    });

  if (error) {
    console.error('Không thể lưu AppState:', error);
  }

  return next;
}

export async function reset() {
  const next = clone(INITIAL);
  await saveAll(next);
  return next;
}

export function useLiveState() {
  const [state, setState] = useState<AppState>(clone(INITIAL));

  useEffect(() => {
    let mounted = true;

    const client = supabase;

    if (!client) {
      console.warn('Supabase chưa được cấu hình.');
      return () => {
        mounted = false;
      };
    }

    // Đọc state hiện tại từ Supabase
    const fetchState = async () => {
      const { data, error } = await client
        .from('app_state')
        .select('data')
        .eq('id', ROW_ID)
        .maybeSingle();

      if (error) {
        console.error('Không thể đọc AppState:', error);
        return;
      }

      if (mounted && data?.data) {
        setState(data.data as AppState);
      }
    };

    fetchState();

    // Realtime: mọi thay đổi trong app_state sẽ cập nhật màn hình ngay
    const channel = client
      .channel('app-state-realtime')
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

          const newData = payload.new as {
            data?: AppState;
          };

          if (newData?.data) {
            setState(newData.data);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(channel);
    };
  }, []);

  return state;
}
