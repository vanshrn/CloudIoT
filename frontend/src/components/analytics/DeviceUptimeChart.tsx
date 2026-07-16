import { Paper, Typography, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { tokens } from '@/theme/theme';

function colorFor(value: number): string {
  if (value >= 95) return tokens.status.online;
  if (value >= 85) return tokens.status.warning;
  return tokens.status.critical;
}

export default function DeviceUptimeChart({ data }: { data: { name: string; value: number }[] }) {
  const sortedData = [...data].sort((a, b) => a.value - b.value);
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">Device uptime</Typography>
        <Typography variant="caption">Last 30 days · top devices</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sortedData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: tokens.text.tertiary }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: tokens.text.tertiary, fontFamily: '"IBM Plex Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }}
            formatter={(value: number) => [`${value}%`, 'Uptime']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {sortedData.map((d, i) => (
              <Cell key={i} fill={colorFor(d.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
