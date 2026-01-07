import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  isComplete: boolean;
  monthsDone: number;
  totalMonths: number;
  isLoading: boolean;
}

// Calculate months since Jan 2026 (sync cutoff date)
const calculateMonthsSinceJan2026 = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  return Math.max(1, (currentYear - 2026) * 12 + currentMonth + 1);
};

export function useSyncStatus(userId: string | undefined) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isComplete: true,
    monthsDone: 0,
    totalMonths: calculateMonthsSinceJan2026(),
    isLoading: true,
  });

  const checkStatus = useCallback(async () => {
    if (!userId) {
      setSyncStatus((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('initial_sync_completed, initial_sync_months_done')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching sync status:', error);
      setSyncStatus((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setSyncStatus({
      isComplete: data?.initial_sync_completed ?? true,
      monthsDone: data?.initial_sync_months_done ?? 0,
      totalMonths: calculateMonthsSinceJan2026(),
      isLoading: false,
    });
  }, [userId]);

  useEffect(() => {
    checkStatus();

    // Poll every 5 seconds while sync is in progress
    const interval = setInterval(() => {
      if (!syncStatus.isComplete && !syncStatus.isLoading) {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkStatus, syncStatus.isComplete, syncStatus.isLoading]);

  return syncStatus;
}
