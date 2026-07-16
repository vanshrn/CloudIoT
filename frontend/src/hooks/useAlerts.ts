import { useEffect, useState, useCallback } from 'react';

import { listAlerts as apiListAlerts, updateAlertStatus as apiUpdateAlertStatus } from '@/api/alerts';
import type { DeviceAlert, AlertStatus } from '@/types/alert';
import { LiveEvents } from '@/hooks/useLiveDashboard';

/**
 * useAlerts — Phase 16.2.
 * Fetches alerts from the real backend when VITE_API_BASE_URL is configured,
 * or falls back to seeded mock data when it is not set.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await apiListAlerts();
      setAlerts(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const handleLiveAlert = (event: Event) => {
      const customEvent = event as CustomEvent<DeviceAlert>;
      setAlerts((prev) => {
        // Prevent duplicates
        if (prev.some((a) => a.id === customEvent.detail.id)) return prev;
        return [customEvent.detail, ...prev];
      });
    };

    LiveEvents.addEventListener('live_alert', handleLiveAlert);

    return () => {
      LiveEvents.removeEventListener('live_alert', handleLiveAlert);
    };
  }, []);

  const updateStatus = useCallback(async (alertId: string, status: AlertStatus) => {
    // Optimistic local update
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)));

    try {
      await apiUpdateAlertStatus(alertId, status);
    } catch (err) {
      // Revert on failure by refetching from server
      void refetch();
    }
  }, [refetch]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    void updateStatus(alertId, 'acknowledged');
  }, [updateStatus]);

  const resolveAlert = useCallback((alertId: string) => {
    void updateStatus(alertId, 'resolved');
  }, [updateStatus]);

  return { alerts, loading, error, refetch, acknowledgeAlert, resolveAlert };
}
