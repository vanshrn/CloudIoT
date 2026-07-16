export type FirmwareChannel = 'stable' | 'beta' | 'deprecated';

export interface Firmware {
  id: string;
  version: string;
  channel: FirmwareChannel;
  deviceType: string;
  sizeKb: number;
  releaseNotes: string;
  releasedAt: string;
  installCount: number;
}

export type DeploymentStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type DeploymentTarget = 'all' | 'group' | 'devices';

export interface Deployment {
  id: string;
  firmwareId: string;
  firmwareVersion: string;
  target: DeploymentTarget;
  targetLabel: string;
  deviceCount: number;
  successCount: number;
  failureCount: number;
  status: DeploymentStatus;
  mode: 'immediate' | 'scheduled';
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  progressPct: number;
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
