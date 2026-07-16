export type FirmwareChannel = 'stable' | 'beta' | 'deprecated';

export interface Firmware {
  id: string;
  version: string;
  channel: FirmwareChannel;
  deviceType: string;
  sizeKb: number;
  releaseNotes: string;
  releasedAt: string; // ISO timestamp
  installCount: number;
}

export type DeploymentStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type DeploymentTarget = 'all' | 'group' | 'devices';

export interface Deployment {
  id: string;
  firmwareId: string;
  firmwareVersion: string;
  target: DeploymentTarget;
  targetLabel: string; // e.g. "Cold Chain (18 devices)" or "3 devices"
  deviceCount: number;
  successCount: number;
  failureCount: number;
  status: DeploymentStatus;
  mode: 'immediate' | 'scheduled';
  scheduledFor: string | null; // ISO timestamp, null if immediate
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  progressPct: number; // 0-100, meaningful while in_progress
}

export interface RollbackEntry {
  id: string;
  deploymentId: string;
  fromVersion: string;
  toVersion: string;
  deviceCount: number;
  reason: string;
  performedAt: string;
  performedBy: string;
}
