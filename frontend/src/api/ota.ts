import { apiClient } from './client';
import axios from 'axios';
import type { Firmware, Deployment, RollbackEntry } from '@/types/ota';
import type { NewFirmwareInput, NewDeploymentInput } from '@/hooks/useOta';

export async function listFirmwares(): Promise<Firmware[]> {
  const { data } = await apiClient.get<{ items: Firmware[] }>('/ota/firmwares');
  return data.items.map((fw) => ({
    ...fw,
    version: fw.version ?? 'Unknown',
    deviceType: fw.deviceType ?? 'Unknown',
    channel: fw.channel ?? 'stable',
    sizeKb: fw.sizeKb ?? 0,
    installCount: fw.installCount ?? 0,
    releaseNotes: fw.releaseNotes ?? '',
  })).sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
}

export async function createFirmware(input: NewFirmwareInput): Promise<Firmware> {
  const { data } = await apiClient.post<Firmware>('/ota/firmwares', input);
  return data;
}

export async function listDeployments(): Promise<Deployment[]> {
  const { data } = await apiClient.get<{ items: Deployment[] }>('/ota/deployments');
  return data.items.map((d) => ({
    ...d,
    firmwareVersion: d.firmwareVersion ?? 'Unknown',
    targetLabel: d.targetLabel ?? 'Unknown',
    progressPct: d.progressPct ?? 0,
    successCount: d.successCount ?? 0,
    failureCount: d.failureCount ?? 0,
    deviceCount: d.deviceCount ?? 0,
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createDeployment(input: NewDeploymentInput): Promise<Deployment> {
  const { data } = await apiClient.post<Deployment>('/ota/deployments', input);
  return data;
}

export async function updateDeployment(
  deploymentId: string,
  input: Partial<Deployment>
): Promise<Deployment> {
  const { data } = await apiClient.put<Deployment>(`/ota/deployments/${deploymentId}`, input);
  return data;
}

export async function listRollbacks(): Promise<RollbackEntry[]> {
  const { data } = await apiClient.get<{ items: RollbackEntry[] }>('/ota/rollbacks');
  return data.items.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
}

export async function createRollback(input: {
  deploymentId: string;
  reason: string;
  fromVersion: string;
  toVersion: string;
  deviceCount: number;
}): Promise<RollbackEntry> {
  const { data } = await apiClient.post<RollbackEntry>('/ota/rollbacks', input);
  return data;
}

export async function uploadFirmwareFile(file: File): Promise<void> {
  // 1. Get presigned URL
  const { data } = await apiClient.post<{ uploadUrl: string, key: string }>('/ota/upload-url');
  
  // 2. Upload to S3 directly via presigned URL (using raw axios, no auth interceptors)
  await axios.put(data.uploadUrl, file, {
    headers: {
      'Content-Type': 'application/octet-stream',
    }
  });
}
