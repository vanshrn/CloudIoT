/**
 * Telemetry API module — Phase 16.3.
 *
 * Typed wrappers around the Telemetry REST API implemented in Phase 15.3
 * (`GET /devices/{deviceId}/telemetry`).
 */
import { apiClient } from './client';
import type { TelemetryPoint } from '@/types/device';
import type { TimeRange } from '@/types/device';

export interface BackendTelemetry {
  deviceId: string;
  timestamp: string;
  temperatureC?: number;
  humidityPct?: number;
  batteryPct?: number;
  voltage?: number;
  rssiDbm?: number;
}

export interface ListTelemetryResponse {
  items: BackendTelemetry[];
  count: number;
  nextToken?: string;
}

export async function listTelemetry(deviceId: string, range: TimeRange): Promise<TelemetryPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime());

  switch (range) {
    case '1h':
      start.setHours(start.getHours() - 1);
      break;
    case '6h':
      start.setHours(start.getHours() - 6);
      break;
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
  }

  const items: BackendTelemetry[] = [];
  let nextToken: string | undefined;

  do {
    const params: Record<string, string> = {
      start: start.toISOString(),
      end: end.toISOString(),
      limit: '1000', // Fetch max allowed by backend to reduce roundtrips
    };
    if (nextToken) params['nextToken'] = nextToken;

    const { data } = await apiClient.get<ListTelemetryResponse>(`/devices/${deviceId}/telemetry`, { params });
    items.push(...data.items);
    nextToken = data.nextToken;
  } while (nextToken);

  // The backend sorts DESC (newest first). Recharts expects ASC (oldest first)
  // for time-series charts so that the X-axis goes left-to-right correctly.
  items.reverse();

  return items.map((item) => ({
    timestamp: item.timestamp,
    temperatureC: item.temperatureC ?? 0,
    humidityPct: item.humidityPct ?? 0,
    batteryPct: item.batteryPct ?? 0,
    voltage: item.voltage ?? 0,
    rssiDbm: item.rssiDbm ?? 0,
  }));
}
