import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DeviceStatusChip } from './StatusChip';
import type { Device } from '@/types/device';

export default function DeviceStatusSummary({ devices }: { devices: Device[] }) {
  const rows = [...devices]
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 6);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6">Device status summary</Typography>
        <Button component={RouterLink} to="/devices" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}>
          View all devices
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Device</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Firmware</TableCell>
            <TableCell align="right">Last seen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
              <TableCell>
                <DeviceStatusChip status={d.status} />
              </TableCell>
              <TableCell>{d.location}</TableCell>
              <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8rem' }}>{d.firmwareVersion}</TableCell>
              <TableCell align="right">{formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
