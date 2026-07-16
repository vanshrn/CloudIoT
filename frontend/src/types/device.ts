export type DeviceStatus = 'online' | 'offline' | 'warning';

export type CertificateStatus = 'valid' | 'expiring' | 'expired';

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  firmwareVersion: string;
  batteryPct: number;
  temperatureC: number;
  humidityPct: number;
  rssiDbm: number;
  lastSeen: string; // ISO timestamp
  location: string;
  ipAddress: string;
  certificateStatus: CertificateStatus;
  voltage: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  deviceType: string;
  group: string;
  credentials?: {
    certificatePem: string;
    privateKey: string;
  };
}

export interface TelemetryPoint {
  timestamp: string;
  temperatureC: number;
  humidityPct: number;
  batteryPct: number;
  voltage: number;
  rssiDbm: number;
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';
