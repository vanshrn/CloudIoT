import { Paper, Stack, Typography, Box } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import type { ComponentType } from 'react';
import { tokens } from '@/theme/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<SvgIconProps>;
  accentColor?: string;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ label, value, icon: Icon, accentColor = tokens.accent.main, trend }: StatCardProps) {
  return (
    <Paper sx={{ p: 2.25, borderRadius: 3, flex: 1, minWidth: 180 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: trend.positive ? tokens.status.online : tokens.status.critical, fontWeight: 600 }}>
              {trend.value}
            </Typography>
          )}
        </Stack>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: `${accentColor}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color: accentColor, fontSize: 20 }} />
        </Box>
      </Stack>
    </Paper>
  );
}
