import { Paper, Typography, Stack } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { tokens } from '@/theme/theme';
import type { TelemetryPoint } from '@/types/device';

interface MetricHistoryChartProps {
  title: string;
  rangeLabel: string;
  data: TelemetryPoint[];
  dataKey: keyof TelemetryPoint;
  unit: string;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function MetricHistoryChart({
  title,
  rangeLabel,
  data,
  dataKey,
  unit,
  color = tokens.accent.main,
  formatValue,
}: MetricHistoryChartProps) {
  const chartData = data.map((p) => ({
    time: format(new Date(p.timestamp), 'HH:mm'),
    value: p[dataKey] as number,
  }));
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="caption">{rangeLabel}</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: tokens.text.tertiary }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} unit={unit} width={44} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }}
            formatter={(value: number) => [formatValue ? formatValue(value) : `${value}${unit}`, title]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
