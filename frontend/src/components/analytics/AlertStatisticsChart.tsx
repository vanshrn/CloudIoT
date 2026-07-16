import { Paper, Typography, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { tokens } from '@/theme/theme';

export default function AlertStatisticsChart({ data }: { data: any[] }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h6">Alert statistics</Typography>
        <Typography variant="caption">Last 7 days · by severity</Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tokens.text.tertiary }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.surface.border}`, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="critical" name="Critical" stackId="a" fill={tokens.status.critical} radius={[0, 0, 0, 0]} />
          <Bar dataKey="warning" name="Warning" stackId="a" fill={tokens.status.warning} radius={[0, 0, 0, 0]} />
          <Bar dataKey="info" name="Info" stackId="a" fill={tokens.status.info} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
