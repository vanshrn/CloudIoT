import { Paper, Table, TableHead, TableBody, TableRow, TableCell, Typography, Box } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import type { RollbackEntry } from '@/types/ota';
import EmptyState from '@/components/EmptyState';
import { tokens } from '@/theme/theme';

interface RollbackHistoryTableProps {
  rollbacks: RollbackEntry[];
}

export default function RollbackHistoryTable({ rollbacks }: RollbackHistoryTableProps) {
  if (rollbacks.length === 0) {
    return <EmptyState title="No rollbacks recorded" description="Rolled-back deployments will be logged here for audit purposes." />;
  }

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Version change</TableCell>
            <TableCell>Devices</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Performed by</TableCell>
            <TableCell align="right">When</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rollbacks.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                  {r.fromVersion} → {r.toVersion}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{r.deviceCount}</Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 320 }}>
                <Typography variant="body2" noWrap title={r.reason}>
                  {r.reason}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{r.performedBy}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption">{formatDistanceToNow(new Date(r.performedAt), { addSuffix: true })}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${tokens.surface.border}` }}>
        <Typography variant="caption">Showing {rollbacks.length} rollbacks</Typography>
      </Box>
    </Paper>
  );
}
