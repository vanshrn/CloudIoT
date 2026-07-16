import { Paper, Typography, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { tokens } from '@/theme/theme';
import { format } from 'date-fns';

interface DeviceActivityWidgetProps {
  trendData?: { date: string; critical: number; warning: number; info: number }[];
}

export default function DeviceActivityWidget({ trendData = [] }: DeviceActivityWidgetProps) {
  const data = trendData.map((p) => ({
    time: format(new Date(p.date), 'dd MMM'),
    events: p.critical + p.warning + p.info,
  }));

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack sx={{ mb: 2 }}>
        <Typography variant="h6">Device alerts</Typography>
        <Typography variant="caption">Total alerts generated, last 7 days</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ left: -18, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(79,124,255,0.06)' }} />
          <Bar dataKey="events" fill={tokens.accent.main} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
