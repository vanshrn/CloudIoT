import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  IconButton,
  Alert,
} from '@mui/material';
import { Close, ContentCopyOutlined, CheckCircle } from '@mui/icons-material';
import type { ApiKey } from '@/types/apiKey';
import { tokens } from '@/theme/theme';

interface CreateApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, scope: ApiKey['scope']) => { fullKey: string };
}

export default function CreateApiKeyDialog({ open, onClose, onCreate }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ApiKey['scope']>('full');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setScope('full');
      setCreatedKey(null);
      setCopied(false);
    }
  }, [open]);

  const handleCreate = () => {
    const { fullKey } = onCreate(name.trim(), scope);
    setCreatedKey(fullKey);
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard?.writeText(createdKey).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        {createdKey ? 'API key created' : 'Create API key'}
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!createdKey ? (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Key name"
              size="small"
              placeholder="e.g. Grafana dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Scope
              </Typography>
              <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as ApiKey['scope'])}>
                <FormControlLabel value="full" control={<Radio size="small" />} label="Full access — read and write" />
                <FormControlLabel value="read-only" control={<Radio size="small" />} label="Read-only" />
              </RadioGroup>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="warning" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              Copy this key now — you won't be able to see it again.
            </Alert>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: tokens.surface.canvas,
                border: `1px solid ${tokens.surface.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace', wordBreak: 'break-all' }}>
                {createdKey}
              </Typography>
              <IconButton size="small" onClick={handleCopy}>
                {copied ? <CheckCircle fontSize="small" sx={{ color: tokens.status.online }} /> : <ContentCopyOutlined fontSize="small" />}
              </IconButton>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {!createdKey ? (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" disabled={!name.trim()} onClick={handleCreate}>
              Create key
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={onClose} fullWidth>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
