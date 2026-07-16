import { Paper, Table, TableHead, TableBody, TableRow, TableCell, Typography, Button, Box } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import type { Deployment } from '@/types/ota';
import { DeploymentStatusChip } from '@/components/StatusChip';
import EmptyState from '@/components/EmptyState';
import { tokens } from '@/theme/theme';

interface DeploymentHistoryTableProps {
  deployments: Deployment[];
  onRollback?: (deployment: Deployment) => void;
}

export default function DeploymentHistoryTable({ deployments, onRollback }: DeploymentHistoryTableProps) {
  if (deployments.length === 0) {
    return <EmptyState title="No deployment history yet" description="Deployments you launch will appear here once they finish." />;
  }

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Firmware</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>When</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deployments.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                  {d.firmwareVersion}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{d.targetLabel}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {d.successCount}/{d.deviceCount} succeeded
                  {d.failureCount > 0 && (
                    <Typography component="span" variant="caption" sx={{ color: tokens.status.critical, ml: 0.5 }}>
                      ({d.failureCount} failed)
                    </Typography>
                  )}
                </Typography>
              </TableCell>
              <TableCell>
                <DeploymentStatusChip status={d.status} />
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {d.completedAt
                    ? formatDistanceToNow(new Date(d.completedAt), { addSuffix: true })
                    : d.status === 'scheduled' && d.scheduledFor
                    ? `scheduled ${formatDistanceToNow(new Date(d.scheduledFor), { addSuffix: true })}`
                    : formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {onRollback && d.status !== 'rolled_back' && (
                  <Button size="small" color="error" onClick={() => onRollback(d)}>
                    Roll back
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${tokens.surface.border}` }}>
        <Typography variant="caption">Showing {deployments.length} deployments</Typography>
      </Box>
    </Paper>
  );
}
