import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Divider, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import type { DeviceAlert } from '@/types/alert';
import { SeverityChip, AlertStatusChip } from './StatusChip';
import { tokens } from '@/theme/theme';

interface AlertDetailsDialogProps {
  alert: DeviceAlert | null;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  canEdit?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ color: tokens.text.tertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Stack>
  );
}

export default function AlertDetailsDialog({ alert, onClose, onAcknowledge, onResolve, canEdit = true }: AlertDetailsDialogProps) {
  return (
    <Dialog open={!!alert} onClose={onClose} maxWidth="xs" fullWidth>
      {alert && (
        <>
          <DialogTitle>Alert details</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <SeverityChip severity={alert.severity} />
                <AlertStatusChip status={alert.status} />
              </Stack>

              <Field label="Message">
                <Typography variant="body2">{alert.message}</Typography>
              </Field>

              <Field label="Device">
                <Typography
                  component={RouterLink}
                  to={`/devices/${alert.deviceId}`}
                  variant="body2"
                  sx={{ color: tokens.accent.main, fontWeight: 600, textDecoration: 'none' }}
                >
                  {alert.deviceName}
                </Typography>
              </Field>

              <Divider />

              <Field label="Raised">
                <Typography variant="body2">
                  {format(new Date(alert.createdAt), 'MMM d, yyyy · HH:mm:ss')} (
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })})
                </Typography>
              </Field>

              <Field label="Alert ID">
                <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                  {alert.id}
                </Typography>
              </Field>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} color="inherit">
              Close
            </Button>
            {canEdit && (
              <>
                {alert.status === 'open' && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      onAcknowledge(alert.id);
                      onClose();
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      onResolve(alert.id);
                      onClose();
                    }}
                  >
                    Resolve
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
