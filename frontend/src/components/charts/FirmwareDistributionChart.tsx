import { Paper, Typography, Stack, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { tokens } from '@/theme/theme';
import type { Device } from '@/types/device';

const COLORS = [tokens.accent.main, tokens.accent.light, '#A6BEFF', tokens.status.warning, tokens.status.offline];

function buildData(devices: Device[]) {
  const counts = new Map<string, number>();
  devices.forEach((d) => counts.set(d.firmwareVersion, (counts.get(d.firmwareVersion) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([version, count]) => ({ name: version, value: count }))
    .sort((a, b) => b.value - a.value);
}

export default function FirmwareDistributionChart({ devices }: { devices: Device[] }) {
  const data = buildData(devices);
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Firmware distribution
      </Typography>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Stack spacing={1} sx={{ flex: 1 }}>
          {data.map((d, i) => (
            <Stack key={d.name} direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8rem' }}>
                  {d.name}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {d.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
