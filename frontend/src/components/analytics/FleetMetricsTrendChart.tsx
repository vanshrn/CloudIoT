import { Paper, Typography, Stack, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { tokens } from '@/theme/theme';

export default function FleetMetricsTrendChart({ data }: { data: any[] }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">Average temperature &amp; battery</Typography>
        <Typography variant="caption">Last 14 days</Typography>
      </Stack>
      <Box sx={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} interval={2} />
            <YAxis
              yAxisId="temp"
              tick={{ fontSize: 11, fill: tokens.text.tertiary }}
              axisLine={false}
              tickLine={false}
              unit="°C"
              width={44}
            />
            <YAxis
              yAxisId="battery"
              orientation="right"
              tick={{ fontSize: 11, fill: tokens.text.tertiary }}
              axisLine={false}
              tickLine={false}
              unit="%"
              width={40}
            />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="temp" type="monotone" dataKey="avgTemp" name="Avg. temp (°C)" stroke={tokens.accent.main} strokeWidth={2} dot={false} />
            <Line
              yAxisId="battery"
              type="monotone"
              dataKey="avgBattery"
              name="Avg. battery (%)"
              stroke={tokens.status.warning}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
