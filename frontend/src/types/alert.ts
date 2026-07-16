export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string; // ISO timestamp
}
