import { Paper, Typography, Stack, Box, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { SeverityChip } from './StatusChip';
import { tokens } from '@/theme/theme';
import type { DeviceAlert } from '@/types/alert';

interface RecentAlertsWidgetProps {
  alerts?: DeviceAlert[];
}

export default function RecentAlertsWidget({ alerts = [] }: RecentAlertsWidgetProps) {
  const recent = alerts.filter((a) => a.status !== 'resolved').slice(0, 5);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6">Recent alerts</Typography>
        <Button component={RouterLink} to="/alerts" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}>
          View all
        </Button>
      </Stack>
      <Stack divider={<Box sx={{ borderBottom: '1px solid #EEF0F3' }} />}>
        {recent.map((alert) => (
          <Stack key={alert.id} direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ py: 1.25 }}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {alert.deviceName}
              </Typography>
              <Typography variant="caption" noWrap>
                {alert.message}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.text.tertiary }}>
                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </Typography>
            </Stack>
            <SeverityChip severity={alert.severity} />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
