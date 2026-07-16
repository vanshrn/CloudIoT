import { useEffect, useState, useCallback, useMemo } from 'react';
import type { TimeRange } from '@/types/device';
import { listTelemetry } from '@/api/telemetry';
import type { TelemetryPoint } from '@/types/device';

/**
 * useDeviceTelemetry — Phase 16.3.
 * Fetches telemetry history for a single device from the real backend
 * when VITE_API_BASE_URL is configured, or falls back to seeded mock data.
 */
export function useDeviceTelemetry(deviceId: string | undefined, range: TimeRange = '24h') {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seed = useMemo(() => {
    if (!deviceId) return 1;
    return deviceId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }, [deviceId]);

  const refetch = useCallback(async () => {
    if (!deviceId) return;
    
    setLoading(true);
    setError(null);

    try {
      const fetched = await listTelemetry(deviceId, range);
      setData(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  }, [deviceId, seed, range]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
