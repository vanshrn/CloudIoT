/**
 * Device API module — Phase 15.2.5.
 *
 * Typed wrappers around the Device Management REST API implemented in
 * Phase 15.2 (`POST /devices`, `GET /devices`, `DELETE /devices/{id}`).
 *
 * Shape mapping
 * ─────────────
 * The backend stores `deviceId` as the primary key; the frontend `Device`
 * type uses `id`. All functions here map between the two so the rest of
 * the frontend never needs to know about `deviceId`.
 *
 * Optional telemetry fields (temperatureC, humidityPct, rssiDbm, batteryPct,
 * voltage, cpuUsagePct, memoryUsagePct) are nullable in the backend because
 * they are populated by the telemetry ingest Lambda (a future phase). The
 * mapping layer applies safe defaults (0) so the existing UI components
 * never receive `undefined` for numeric fields they always render.
 *
 * Token
 * ─────
 * The Axios client's request interceptor (api/client.ts) attaches the
 * Cognito access token to every request. This module does not touch headers.
 */
import { apiClient } from './client';
import type { Device } from '@/types/device';

// ── Shape of a backend Device item ───────────────────────────────────────────

interface BackendDevice {
  deviceId: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  firmwareVersion: string;
  lastSeen: string;
  location: string;
  deviceType: string;
  group: string;
  ipAddress: string;
  certificateStatus: 'valid' | 'expiring' | 'expired';
  // Telemetry fields — populated by the ingest Lambda (Phase 15.3+)
  batteryPct?: number;
  temperatureC?: number;
  humidityPct?: number;
  rssiDbm?: number;
  voltage?: number;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
  createdAt: string;
  updatedAt: string;
  credentials?: {
    certificatePem: string;
    privateKey: string;
  };
}

interface ListDevicesResponse {
  items: BackendDevice[];
  count: number;
  nextToken?: string;
}

interface CreateDevicePayload {
  name: string;
  deviceType: string;
  group: string;
  location: string;
  firmwareVersion?: string;
  ipAddress?: string;
}

/** Maps a backend device record to the frontend Device shape. */
function toFrontend(b: BackendDevice): Device {
  return {
    id: b.deviceId,
    name: b.name || 'Unnamed Device',
    status: b.status,
    firmwareVersion: b.firmwareVersion || 'unknown',
    lastSeen: b.lastSeen || b.createdAt || new Date().toISOString(),
    location: b.location || 'Unknown Location',
    deviceType: b.deviceType || 'Unknown Type',
    group: b.group || 'Default Group',
    ipAddress: b.ipAddress ?? '',
    certificateStatus: b.certificateStatus,
    // Telemetry fields default to 0 until the ingest Lambda populates them.
    batteryPct: b.batteryPct ?? 0,
    temperatureC: b.temperatureC ?? 0,
    humidityPct: b.humidityPct ?? 0,
    rssiDbm: b.rssiDbm ?? 0,
    voltage: b.voltage ?? 0,
    cpuUsagePct: b.cpuUsagePct ?? 0,
    memoryUsagePct: b.memoryUsagePct ?? 0,
    credentials: b.credentials,
  };
}

/**
 * Fetch all devices. Transparently pages through all results so callers
 * receive the full fleet in one call (suitable for fleets up to a few
 * thousand devices — revisit if the fleet grows larger).
 */
export async function listDevices(): Promise<Device[]> {
  const items: Device[] = [];
  let nextToken: string | undefined;

  do {
    const params: Record<string, string> = { limit: '200' };
    if (nextToken) params['nextToken'] = nextToken;

    const { data } = await apiClient.get<ListDevicesResponse>('/devices', { params });
    items.push(...data.items.map(toFrontend));
    nextToken = data.nextToken;
  } while (nextToken);

  return items;
}

/**
 * Create a new device. Returns the full Device record as persisted by the
 * backend (including the generated deviceId and server timestamps).
 */
export async function createDevice(payload: CreateDevicePayload): Promise<Device> {
  const { data } = await apiClient.post<BackendDevice>('/devices', payload);
  return toFrontend(data);
}

/**
 * Delete a device by its frontend `id` (mapped to `deviceId` before the
 * request is sent). Resolves when the backend returns 204.
 */
export async function deleteDevice(id: string): Promise<void> {
  await apiClient.delete(`/devices/${id}`);
}

/**
 * Get a single device by its frontend `id`.
 */
export async function getDevice(id: string): Promise<Device> {
  const { data } = await apiClient.get<BackendDevice>(`/devices/${id}`);
  return toFrontend(data);
}
