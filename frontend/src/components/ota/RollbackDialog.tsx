import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, Stack } from '@mui/material';
import type { Deployment } from '@/types/ota';

interface RollbackDialogProps {
  deployment: Deployment | null;
  onClose: () => void;
  onConfirm: (deploymentId: string, reason: string) => void;
}

export default function RollbackDialog({ deployment, onClose, onConfirm }: RollbackDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (deployment) setReason('');
  }, [deployment]);

  return (
    <Dialog open={!!deployment} onClose={onClose} maxWidth="xs" fullWidth>
      {deployment && (
        <>
          <DialogTitle>Roll back deployment</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>
                This will revert {deployment.deviceCount} device(s) from {deployment.firmwareVersion} to their previous firmware
                version. This action is logged in the rollback history.
              </DialogContentText>
              <TextField
                label="Reason for rollback"
                size="small"
                multiline
                minRows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={!reason.trim()}
              onClick={() => {
                onConfirm(deployment.id, reason.trim());
                onClose();
              }}
            >
              Roll back
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
