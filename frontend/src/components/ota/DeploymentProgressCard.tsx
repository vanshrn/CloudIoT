import { Paper, Stack, Typography, LinearProgress, Box, Button } from '@mui/material';
import { format } from 'date-fns';
import type { Deployment } from '@/types/ota';
import { DeploymentStatusChip } from '@/components/StatusChip';
import { tokens } from '@/theme/theme';

interface DeploymentProgressCardProps {
  deployment: Deployment;
  onRollback?: (deployment: Deployment) => void;
}

export default function DeploymentProgressCard({ deployment, onRollback }: DeploymentProgressCardProps) {
  const isScheduled = deployment.status === 'scheduled';
  const barColor = isScheduled ? tokens.status.info : tokens.status.warning;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.9375rem' }}>
            {deployment.firmwareVersion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {deployment.targetLabel}
          </Typography>
        </Stack>
        <DeploymentStatusChip status={deployment.status} />
      </Stack>

      {isScheduled ? (
        <Typography variant="body2" color="text.secondary">
          Scheduled for {deployment.scheduledFor ? format(new Date(deployment.scheduledFor), 'MMM d, yyyy · HH:mm') : '—'}
        </Typography>
      ) : (
        <>
          <LinearProgress
            variant="determinate"
            value={deployment.progressPct}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 1,
              bgcolor: tokens.surface.canvas,
              '& .MuiLinearProgress-bar': { bgcolor: barColor },
            }}
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">
              {deployment.successCount} of {deployment.deviceCount} devices updated
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {deployment.progressPct}%
            </Typography>
          </Stack>
        </>
      )}

      {onRollback && deployment.status !== 'rolled_back' && (
        <Box sx={{ mt: 1.5, textAlign: 'right' }}>
          <Button size="small" color="error" variant="outlined" onClick={() => onRollback(deployment)}>
            Roll back
          </Button>
        </Box>
      )}
    </Paper>
  );
}
