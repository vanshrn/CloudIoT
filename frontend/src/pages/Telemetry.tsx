import { useMemo, useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Skeleton,
} from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { format } from 'date-fns';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceTelemetry } from '@/hooks/useDeviceTelemetry';
import MetricHistoryChart from '@/components/charts/MetricHistoryChart';
import { DeviceStatusChip } from '@/components/StatusChip';
import { tokens } from '@/theme/theme';
import type { TimeRange } from '@/types/device';

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
];

const RANGE_LABELS: Record<TimeRange, string> = {
  '1h': 'Last hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
};

export default function Telemetry() {
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();
  const [deviceId, setDeviceId] = useState('');
  const [range, setRange] = useState<TimeRange>('24h');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  useEffect(() => {
    if (devices.length > 0 && !deviceId) {
      setDeviceId(devices[0].id);
    }
  }, [devices, deviceId]);

  const device = useMemo(() => devices.find((d) => d.id === deviceId), [deviceId, devices]);
  const { data, loading, error } = useDeviceTelemetry(deviceId, range);

  const handleExport = () => {
    if (!data || data.length === 0) return;
    setExporting(true);

    try {
      const headers = ['Timestamp', 'ISO Date', 'Temperature (C)', 'Humidity (%)', 'Battery (%)', 'Voltage (V)', 'RSSI (dBm)'];
      
      const rows = data.map((point) => {
        const dateStr = new Date(point.timestamp).toISOString();
        return [
          point.timestamp,
          dateStr,
          point.temperatureC,
          point.humidityPct,
          point.batteryPct,
          point.voltage,
          point.rssiDbm,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safeName = (device?.name || deviceId).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `telemetry_${safeName}_${range}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportDone(true);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: 260 }} disabled={devicesLoading || devices.length === 0}>
            <InputLabel>Device</InputLabel>
            <Select label="Device" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {devices.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} — {d.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup value={range} exclusive size="small" onChange={(_, val) => val && setRange(val)}>
            {RANGE_OPTIONS.map((r) => (
              <ToggleButton key={r.value} value={r.value}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlined />}
          onClick={handleExport}
          disabled={exporting || loading}
        >
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </Stack>

      {/* API error banner */}
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {/* Selected device header */}
      {device && (
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="h6">{device.name}</Typography>
          <DeviceStatusChip status={device.status} />
          <Typography variant="body2" color="text.secondary">
            {device.location} · {device.deviceType}
          </Typography>
        </Stack>
      )}

      {/* Charts grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={260} />)
        ) : (
          <>
            <MetricHistoryChart
              title="Temperature"
              rangeLabel={RANGE_LABELS[range]}
              data={data}
              dataKey="temperatureC"
              unit="°C"
              color={tokens.accent.main}
            />
            <MetricHistoryChart
              title="Humidity"
              rangeLabel={RANGE_LABELS[range]}
              data={data}
              dataKey="humidityPct"
              unit="%"
              color={tokens.status.info}
            />
            <MetricHistoryChart
              title="Battery"
              rangeLabel={RANGE_LABELS[range]}
              data={data}
              dataKey="batteryPct"
              unit="%"
              color={tokens.status.online}
            />
            <MetricHistoryChart
              title="Voltage"
              rangeLabel={RANGE_LABELS[range]}
              data={data}
              dataKey="voltage"
              unit="V"
              color={tokens.status.warning}
            />
            <MetricHistoryChart
              title="RSSI"
              rangeLabel={RANGE_LABELS[range]}
              data={data}
              dataKey="rssiDbm"
              unit=" dBm"
              color={tokens.accent.dark}
            />
          </>
        )}
      </Box>

      {/* Latest readings table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="h6">Latest readings</Typography>
          <Typography variant="caption">Most recent first</Typography>
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
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : [...data]
                  .slice(-15)
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

      <Snackbar
        open={exportDone}
        autoHideDuration={3000}
        onClose={() => setExportDone(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setExportDone(false)} sx={{ borderRadius: 2 }}>
          Exported {device?.name} telemetry ({RANGE_LABELS[range].toLowerCase()}) as CSV
        </Alert>
      </Snackbar>
    </Stack>
  );
}
