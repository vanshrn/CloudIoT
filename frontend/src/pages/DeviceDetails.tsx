import { useState, type ReactNode } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  Divider,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBackOutlined,
  RestartAltOutlined,
  SystemUpdateAltOutlined,
  DeleteOutline,
  PlaceOutlined,
  ThermostatOutlined,
  WaterDropOutlined,
  BoltOutlined,
  SignalCellularAltOutlined,
  MemoryOutlined,
  StorageOutlined,
  BatteryFull,
  Battery60,
  Battery20,
  RefreshOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDevice } from '@/hooks/useDevice';
import { useDeviceTelemetry } from '@/hooks/useDeviceTelemetry';
import { DeviceStatusChip } from '@/components/StatusChip';
import SensorCard from '@/components/SensorCard';
import MetricHistoryChart from '@/components/charts/MetricHistoryChart';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { tokens } from '@/theme/theme';
import type { CertificateStatus } from '@/types/device';

type ActionType = 'ota' | 'restart' | 'delete';

const CERT_CONFIG: Record<CertificateStatus, { label: string; color: string }> = {
  valid: { label: 'Certificate valid', color: tokens.status.online },
  expiring: { label: 'Certificate expiring soon', color: tokens.status.warning },
  expired: { label: 'Certificate expired', color: tokens.status.critical },
};

function batteryIcon(pct: number) {
  if (pct > 60) return BatteryFull;
  if (pct > 25) return Battery60;
  return Battery20;
}

function batteryColor(pct: number) {
  if (pct > 60) return tokens.status.online;
  if (pct > 25) return tokens.status.warning;
  return tokens.status.critical;
}

export default function DeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { device, loading, notFound, refetch, updateDevice } = useDevice(deviceId);
  const { data: telemetry, loading: telemetryLoading } = useDeviceTelemetry(deviceId);

  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleConfirmAction = () => {
    if (!pendingAction || !device) return;
    setActionLoading(true);
    setTimeout(() => {
      if (pendingAction === 'delete') {
        setActionLoading(false);
        setPendingAction(null);
        navigate('/devices');
        return;
      }
      if (pendingAction === 'restart') {
        updateDevice({ lastSeen: new Date().toISOString() });
      }
      // 'ota' is simulated — a real deployment call would go here.
      setActionLoading(false);
      setPendingAction(null);
    }, 900);
  };

  if (notFound) {
    return (
      <Stack spacing={2.5}>
        <Breadcrumbs>
          <Link component={RouterLink} to="/devices" underline="hover" color="inherit">
            Devices
          </Link>
          <Typography color="text.primary">Not found</Typography>
        </Breadcrumbs>
        <EmptyState
          title="Device not found"
          description="This device may have been removed from the fleet, or the link is incorrect."
          actionLabel="Back to devices"
          onAction={() => navigate('/devices')}
        />
      </Stack>
    );
  }

  const BatteryIcon = device ? batteryIcon(device.batteryPct) : BatteryFull;

  return (
    <Stack spacing={2.5}>
      {/* Breadcrumb + header */}
      <Stack spacing={1.5}>
        <Breadcrumbs>
          <Link component={RouterLink} to="/devices" underline="hover" color="inherit">
            Devices
          </Link>
          <Typography color="text.primary">{loading ? <Skeleton width={100} /> : device?.name}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton size="small" onClick={() => navigate('/devices')} sx={{ border: `1px solid ${tokens.surface.border}` }}>
              <ArrowBackOutlined fontSize="small" />
            </IconButton>
            {loading ? (
              <Skeleton width={220} height={40} />
            ) : (
              <Stack spacing={0.25}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Typography variant="h4">{device?.name}</Typography>
                  {device && <DeviceStatusChip status={device.status} />}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PlaceOutlined sx={{ fontSize: 15, color: tokens.text.tertiary }} />
                  <Typography variant="body2" color="text.secondary">
                    {device?.location} · {device?.deviceType}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={refetch} sx={{ border: `1px solid ${tokens.surface.border}` }}>
                <RefreshOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<RestartAltOutlined />} onClick={() => setPendingAction('restart')} disabled={loading}>
              Restart
            </Button>
            <Button variant="outlined" startIcon={<SystemUpdateAltOutlined />} onClick={() => setPendingAction('ota')} disabled={loading}>
              OTA Update
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={() => setPendingAction('delete')}
              disabled={loading}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* General information */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          General information
        </Typography>
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={40} />
            ))}
          </Box>
        ) : (
          device && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              <InfoField label="Device ID" value={device.id} mono />
              <InfoField label="Group" value={device.group} />
              <InfoField label="Firmware version" value={device.firmwareVersion} mono />
              <InfoField label="IP address" value={device.ipAddress} mono />
              <InfoField label="Location" value={device.location} />
              <InfoField label="Device type" value={device.deviceType} />
              <InfoField label="Last seen" value={format(new Date(device.lastSeen), 'MMM d, yyyy · HH:mm:ss')} />
              <InfoField
                label="Certificate"
                value={
                  <Chip
                    size="small"
                    label={CERT_CONFIG[device.certificateStatus].label}
                    sx={{
                      bgcolor: `${CERT_CONFIG[device.certificateStatus].color}18`,
                      color: CERT_CONFIG[device.certificateStatus].color,
                      fontWeight: 600,
                    }}
                  />
                }
              />
            </Box>
          )
        )}
      </Paper>

      {/* Sensor cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', lg: 'repeat(7, 1fr)' },
          gap: 2,
        }}
      >
        {loading || !device ? (
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} variant="rounded" height={100} />)
        ) : (
          <>
            <SensorCard label="Temperature" value={`${device.temperatureC}°C`} icon={ThermostatOutlined} color={tokens.accent.main} />
            <SensorCard label="Humidity" value={`${device.humidityPct}%`} icon={WaterDropOutlined} color={tokens.status.info} />
            <SensorCard
              label="Battery"
              value={`${device.batteryPct}%`}
              icon={BatteryIcon}
              color={batteryColor(device.batteryPct)}
            />
            <SensorCard label="Voltage" value={`${device.voltage} V`} icon={BoltOutlined} color={tokens.status.warning} />
            <SensorCard label="RSSI" value={`${device.rssiDbm} dBm`} icon={SignalCellularAltOutlined} color={tokens.accent.main} />
            <SensorCard label="CPU usage" value={`${device.cpuUsagePct}%`} icon={MemoryOutlined} color={tokens.status.online} />
            <SensorCard label="Memory usage" value={`${device.memoryUsagePct}%`} icon={StorageOutlined} color={tokens.status.online} />
          </>
        )}
      </Box>

      {/* History charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
        {telemetryLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={260} />)
        ) : (
          <>
            <MetricHistoryChart
              title="Temperature"
              rangeLabel="Last 24 hours"
              data={telemetry}
              dataKey="temperatureC"
              unit="°C"
              color={tokens.accent.main}
            />
            <MetricHistoryChart
              title="Humidity"
              rangeLabel="Last 24 hours"
              data={telemetry}
              dataKey="humidityPct"
              unit="%"
              color={tokens.status.info}
            />
            <MetricHistoryChart
              title="Battery"
              rangeLabel="Last 24 hours"
              data={telemetry}
              dataKey="batteryPct"
              unit="%"
              color={tokens.status.online}
            />
          </>
        )}
      </Box>

      {/* Telemetry table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="h6">Recent telemetry</Typography>
          <Typography variant="caption">Most recent readings first</Typography>
        </Stack>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell align="right">Temp (°C)</TableCell>
              <TableCell align="right">Humidity (%)</TableCell>
              <TableCell align="right">Battery (%)</TableCell>
              <TableCell align="right">Voltage (V)</TableCell>
              <TableCell align="right">RSSI (dBm)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {telemetryLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : [...telemetry]
                  .slice(-12)
                  .reverse()
                  .map((point) => (
                    <TableRow key={point.timestamp} hover>
                      <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8125rem' }}>
                        {format(new Date(point.timestamp), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell align="right">{point.temperatureC}</TableCell>
                      <TableCell align="right">{point.humidityPct}</TableCell>
                      <TableCell align="right">{point.batteryPct}</TableCell>
                      <TableCell align="right">{point.voltage}</TableCell>
                      <TableCell align="right">{point.rssiDbm}</TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </Paper>

      <ConfirmDialog
        open={!!pendingAction}
        loading={actionLoading}
        title={
          pendingAction === 'ota' ? 'Deploy OTA update?' : pendingAction === 'restart' ? 'Restart device?' : 'Delete device?'
        }
        description={
          pendingAction === 'ota'
            ? `This will push the latest firmware to ${device?.name}. The device will reboot once the update completes.`
            : pendingAction === 'restart'
              ? `${device?.name} will restart and be briefly offline. Continue?`
              : `This permanently removes ${device?.name} from your fleet. This can't be undone.`
        }
        confirmLabel={pendingAction === 'ota' ? 'Deploy update' : pendingAction === 'restart' ? 'Restart' : 'Delete device'}
        destructive={pendingAction === 'delete'}
        onConfirm={handleConfirmAction}
        onClose={() => setPendingAction(null)}
      />
    </Stack>
  );
}

function InfoField({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={mono ? { fontFamily: '"IBM Plex Mono", monospace' } : undefined}
          noWrap
        >
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}
