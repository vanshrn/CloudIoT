import { Paper, Stack, Typography, Box } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import type { ComponentType } from 'react';
import { tokens } from '@/theme/theme';

interface SensorCardProps {
  label: string;
  value: string;
  icon: ComponentType<SvgIconProps>;
  color?: string;
  helperText?: string;
}

export default function SensorCard({ label, value, icon: Icon, color = tokens.accent.main, helperText }: SensorCardProps) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 2,
            bgcolor: `${color}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16, color }} />
        </Box>
        <Typography variant="subtitle2" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}
    </Paper>
  );
}
