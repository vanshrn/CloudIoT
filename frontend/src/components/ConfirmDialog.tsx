import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
