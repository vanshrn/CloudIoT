import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/api/ota';
import type { Deployment, Firmware, RollbackEntry } from '@/types/ota';

export interface NewDeploymentInput {
  firmwareId: string;
  firmwareVersion?: string;
  target: Deployment['target'];
  targetLabel: string;
  deviceCount: number;
  targetDeviceIds: string[];
  mode: Deployment['mode'];
  scheduledFor: string | null;
}

export interface NewFirmwareInput {
  file?: File;
  version: string;
  deviceType: string;
  channel: Firmware['channel'];
  sizeKb: number;
  releaseNotes: string;
}

/**
 * Simulates fetching + mutating OTA state from an API (artificial delay,
 * local state, and a setInterval-driven progress simulation for
 * in-progress deployments). Swap the bodies of refetch / create* for real
 * apiClient calls later without touching any consuming component.
 */
export function useOta() {
  const [firmwares, setFirmwares] = useState<Firmware[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [rollbacks, setRollbacks] = useState<RollbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const progressTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Fake simulation removed in favor of real polling
  const refetch = useCallback(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fw, dep, rb] = await Promise.all([
          api.listFirmwares(),
          api.listDeployments(),
          api.listRollbacks()
        ]);
        setFirmwares(fw);
        setDeployments(dep);
        setRollbacks(rb);
      } catch (err) {
        console.error('Failed to fetch OTA data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => refetch(), [refetch]);

  // Poll for real updates from the backend if any deployment is active
  useEffect(() => {
    const hasActive = deployments.some((d) => d.status === 'in_progress' || d.status === 'scheduled');
    if (!hasActive) return;

    const timer = setInterval(() => {
      refetch();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(timer);
  }, [deployments, refetch]);

  const uploadFirmware = useCallback(async (input: NewFirmwareInput) => {
    try {
      if (input.file) {
        await api.uploadFirmwareFile(input.file);
      }
      const payload = { ...input };
      delete payload.file; // Don't send file object to DynamoDB
      
      const firmware = await api.createFirmware(payload);
      setFirmwares((prev) => [firmware, ...prev]);
      return firmware;
    } catch (err) {
      console.error('Failed to upload firmware:', err);
      throw err;
    }
  }, []);

  const createDeployment = useCallback(
    async (input: NewDeploymentInput) => {
      try {
        const firmware = firmwares.find((f) => f.id === input.firmwareId);
        const payload = {
          ...input,
          firmwareVersion: firmware?.version ?? 'Unknown',
        };
        const deployment = await api.createDeployment(payload);
        setDeployments((prev) => [deployment, ...prev]);
        return deployment;
      } catch (err) {
        console.error('Failed to create deployment:', err);
        throw err;
      }
    },
    [firmwares],
  );

  const rollbackDeployment = useCallback(
    async (deploymentId: string, reason: string) => {
      try {
        const target = deployments.find((d) => d.id === deploymentId);
        if (!target) return;

        const entry = await api.createRollback({
          deploymentId,
          reason,
          fromVersion: target.firmwareVersion,
          toVersion: 'previous',
          deviceCount: target.deviceCount,
        });
        
        await api.updateDeployment(deploymentId, { status: 'rolled_back' });

        setDeployments((prev) => prev.map((d) => (d.id === deploymentId ? { ...d, status: 'rolled_back' as const } : d)));
        setRollbacks((prev) => [entry, ...prev]);
      } catch (err) {
        console.error('Failed to create rollback:', err);
        throw err;
      }
    },
    [deployments],
  );

  return {
    firmwares,
    deployments,
    rollbacks,
    loading,
    refetch,
    uploadFirmware,
    createDeployment,
    rollbackDeployment,
  };
}
