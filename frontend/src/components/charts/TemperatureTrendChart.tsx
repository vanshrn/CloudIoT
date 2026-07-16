import { Paper, Typography, Stack } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '@/theme/theme';
import { format } from 'date-fns';

interface TemperatureTrendChartProps {
  trendData?: { date: string; avgTemp: number; avgBattery: number }[];
}

export default function TemperatureTrendChart({ trendData = [] }: TemperatureTrendChartProps) {
  const data = trendData.map((p) => ({
    time: format(new Date(p.date), 'dd MMM'),
    temp: p.avgTemp,
  }));

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">Temperature trend</Typography>
        <Typography variant="caption">Last 24 hours · Fleet average</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.accent.main} stopOpacity={0.35} />
              <stop offset="100%" stopColor={tokens.accent.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} interval={5} />
          <YAxis tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} unit="°C" width={44} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }}
            formatter={(value: number) => [`${value}°C`, 'Avg. temp']}
          />
          <Area type="monotone" dataKey="temp" stroke={tokens.accent.main} strokeWidth={2} fill="url(#tempGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
