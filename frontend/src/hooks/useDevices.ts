import { useEffect, useState, useCallback } from 'react';

import { listDevices as apiListDevices, deleteDevice as apiDeleteDevice, createDevice as apiCreateDevice } from '@/api/devices';
import type { Device } from '@/types/device';
import { LiveEvents } from '@/hooks/useLiveDashboard';

/**
 * useDevices — Phase 15.2.5.
 *
 * Fetches the device fleet from the real backend when VITE_API_BASE_URL is
 * configured (i.e. a real API Gateway has been deployed), or falls back to
 * the seeded mock data when it is not set.
 *
 * The mock fallback means the frontend is still fully usable without a live
 * backend, which is important while other pages still rely on mock data.
 *
 * The hook surface is unchanged from the mock version so Devices.tsx and any
 * other consumer requires no modifications to take advantage of the real API:
 *   { devices, loading, error, refetch, removeDevice, addDevice, updateDevice }
 *
 * `removeDevice` and `addDevice` are now optimistic: they update local state
 * immediately (so the UI responds without a round-trip) and the Devices page
 * triggers a full refetch after the backend call completes.
 */

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await apiListDevices();
      setDevices(fetched);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load devices from the API.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const handleLiveTelemetry = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const { deviceId, timestamp } = customEvent.detail;
      setDevices((prev) => {
        return prev.map((d) => 
          d.id === deviceId ? { ...d, status: 'online', lastSeen: timestamp } : d
        );
      });
    };

    LiveEvents.addEventListener('live_telemetry', handleLiveTelemetry);

    return () => {
      LiveEvents.removeEventListener('live_telemetry', handleLiveTelemetry);
    };
  }, []);

  /** Optimistically remove a device from local state. */
  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }, []);

  /** Optimistically prepend a device to local state. */
  const addDevice = useCallback((device: Device) => {
    setDevices((prev) => [device, ...prev]);
  }, []);

  const updateDevice = useCallback((deviceId: string, patch: Partial<Device>) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...patch } : d)));
  }, []);

  return { devices, loading, error, refetch, removeDevice, addDevice, updateDevice };
}
