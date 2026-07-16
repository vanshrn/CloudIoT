import { Paper, Typography, Stack } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '@/theme/theme';

export default function AvailabilityTrendChart({ data }: { data: any[] }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">Fleet availability</Typography>
        <Typography variant="caption">Last 14 days</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} interval={2} />
          <YAxis
            domain={[90, 100]}
            tick={{ fontSize: 11, fill: tokens.text.tertiary }}
            axisLine={false}
            tickLine={false}
            unit="%"
            width={40}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }}
            formatter={(value: number) => [`${value}%`, 'Availability']}
          />
          <Line type="monotone" dataKey="availabilityPct" stroke={tokens.status.online} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
