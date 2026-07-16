import { Paper, Typography, Stack, Box, LinearProgress } from '@mui/material';
import { tokens } from '@/theme/theme';
import type { Device } from '@/types/device';

export default function FleetHealthWidget({ devices }: { devices: Device[] }) {
  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const warning = devices.filter((d) => d.status === 'warning').length;
  const offline = devices.filter((d) => d.status === 'offline').length;

  const rows = [
    { label: 'Online', value: online, color: tokens.status.online },
    { label: 'Warning', value: warning, color: tokens.status.warning },
    { label: 'Offline', value: offline, color: tokens.status.offline },
  ];

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Fleet health
      </Typography>
      <Stack spacing={2}>
        {rows.map((row) => (
          <Box key={row.label}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2">{row.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {row.value} / {total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={total > 0 ? (row.value / total) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 6,
                bgcolor: '#EEF0F3',
                '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 6 },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
