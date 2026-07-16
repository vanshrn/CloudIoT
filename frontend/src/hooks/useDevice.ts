import { useEffect, useState, useCallback } from 'react';

import { getDevice } from '@/api/devices';
import type { Device } from '@/types/device';

/**
 * Simulates fetching a single device by ID (artificial delay + local state).
 * Swap the body of `refetch` for a real `apiClient.get(`/devices/${deviceId}`)`
 * call later without touching any consuming component.
 */
export function useDevice(deviceId: string | undefined) {
  const [device, setDevice] = useState<Device | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(() => {
    if (!deviceId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    getDevice(deviceId)
      .then((found) => {
        setDevice(found);
        setNotFound(false);
      })
      .catch((err) => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [deviceId]);

  useEffect(() => refetch(), [refetch]);

  const updateDevice = useCallback((patch: Partial<Device>) => {
    setDevice((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return { device, loading, notFound, refetch, updateDevice };
}
