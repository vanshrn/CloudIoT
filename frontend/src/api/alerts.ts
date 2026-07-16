/**
 * Alerts API module — Phase 16.2.
 *
 * Typed wrappers around the Alerts REST API implemented in Phase 15.4
 * (`GET /alerts`, `PUT /alerts/{id}`).
 *
 * Maps backend payload shapes (e.g. alertId, 'active' status) to the frontend
 * `DeviceAlert` shape (e.g. id, 'open' status). Fetches devices in parallel
 * to populate `deviceName`, since the backend only stores `deviceId`.
 */
import { apiClient } from './client';
import { listDevices } from './devices';
import type { DeviceAlert, AlertStatus } from '@/types/alert';

interface BackendAlert {
  alertId: string;
  deviceId: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface ListAlertsResponse {
  items: BackendAlert[];
  count: number;
  nextToken?: string;
}

function mapStatus(backendStatus: 'active' | 'acknowledged' | 'resolved'): AlertStatus {
  return backendStatus === 'active' ? 'open' : backendStatus;
}

function unmapStatus(frontendStatus: AlertStatus): 'active' | 'acknowledged' | 'resolved' {
  return frontendStatus === 'open' ? 'active' : frontendStatus;
}

export async function listAlerts(): Promise<DeviceAlert[]> {
  const items: BackendAlert[] = [];
  let nextToken: string | undefined;

  do {
    const params: Record<string, string> = { limit: '100' };
    if (nextToken) params['nextToken'] = nextToken;

    const { data } = await apiClient.get<ListAlertsResponse>('/alerts', { params });
    items.push(...data.items);
    nextToken = data.nextToken;
  } while (nextToken);

  // The Alerts UI shows device names, but the Alerts backend only stores device IDs.
  // We fetch the device list here to construct a mapping so we don't have to change
  // the UI or backend architectures. In a production app, the backend might handle
  // this join or use an aggregated read model.
  let deviceMap = new Map<string, string>();
  try {
    const devices = await listDevices();
    deviceMap = new Map(devices.map((d) => [d.id, d.name]));
  } catch (err) {
    console.warn('Failed to fetch devices for alert mapping', err);
  }

  return items.map((b) => ({
    id: b.alertId,
    deviceId: b.deviceId,
    deviceName: deviceMap.get(b.deviceId) || b.deviceId,
    message: b.message,
    severity: b.severity,
    status: mapStatus(b.status),
    createdAt: b.createdAt,
  }));
}

export async function updateAlertStatus(alertId: string, status: AlertStatus): Promise<DeviceAlert> {
  const backendStatus = unmapStatus(status);
  const { data } = await apiClient.put<BackendAlert>(`/alerts/${alertId}`, { status: backendStatus });
  
  return {
    id: data.alertId,
    deviceId: data.deviceId,
    deviceName: data.deviceId, // UI hook optimistically updates status only; deviceName isn't needed here.
    message: data.message,
    severity: data.severity,
    status: mapStatus(data.status),
    createdAt: data.createdAt,
  };
}
