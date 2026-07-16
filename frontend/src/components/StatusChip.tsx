import { Chip } from '@mui/material';
import { tokens } from '@/theme/theme';
import type { DeviceStatus } from '@/types/device';
import type { AlertSeverity, AlertStatus } from '@/types/alert';
import type { FirmwareChannel, DeploymentStatus } from '@/types/ota';
import type { UserStatus, UserRole } from '@/types/user';

const DEVICE_STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string }> = {
  online: { label: 'Online', color: tokens.status.online },
  offline: { label: 'Offline', color: tokens.status.offline },
  warning: { label: 'Warning', color: tokens.status.warning },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: tokens.status.critical },
  warning: { label: 'Warning', color: tokens.status.warning },
  info: { label: 'Info', color: tokens.status.info },
};

const ALERT_STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: tokens.status.critical },
  acknowledged: { label: 'Acknowledged', color: tokens.status.warning },
  resolved: { label: 'Resolved', color: tokens.status.online },
};

function DotChip({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        bgcolor: `${color}18`,
        color,
        border: `1px solid ${color}33`,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

export function DeviceStatusChip({ status }: { status: DeviceStatus }) {
  const cfg = DEVICE_STATUS_CONFIG[status];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

export function SeverityChip({ severity }: { severity: AlertSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

export function AlertStatusChip({ status }: { status: AlertStatus }) {
  const cfg = ALERT_STATUS_CONFIG[status];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

const FIRMWARE_CHANNEL_CONFIG: Record<FirmwareChannel, { label: string; color: string }> = {
  stable: { label: 'Stable', color: tokens.status.online },
  beta: { label: 'Beta', color: tokens.status.info },
  deprecated: { label: 'Deprecated', color: tokens.status.offline },
};

const DEPLOYMENT_STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: tokens.status.info },
  in_progress: { label: 'In progress', color: tokens.status.warning },
  completed: { label: 'Completed', color: tokens.status.online },
  failed: { label: 'Failed', color: tokens.status.critical },
  rolled_back: { label: 'Rolled back', color: tokens.status.offline },
};

export function FirmwareChannelChip({ channel }: { channel: FirmwareChannel }) {
  const cfg = FIRMWARE_CHANNEL_CONFIG[channel];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

export function DeploymentStatusChip({ status }: { status: DeploymentStatus }) {
  const cfg = DEPLOYMENT_STATUS_CONFIG[status];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

const USER_STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: tokens.status.online },
  invited: { label: 'Invited', color: tokens.status.info },
  suspended: { label: 'Suspended', color: tokens.status.critical },
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  Administrator: { label: 'Administrator', color: tokens.accent.main },
  Operator: { label: 'Operator', color: tokens.status.warning },
  Viewer: { label: 'Viewer', color: tokens.status.offline },
};

export function UserStatusChip({ status }: { status: UserStatus }) {
  const cfg = USER_STATUS_CONFIG[status];
  return <DotChip label={cfg.label} color={cfg.color} />;
}

export function RoleChip({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return <DotChip label={cfg.label} color={cfg.color} />;
}
