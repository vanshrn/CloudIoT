import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { CloudUploadOutlined, InsertDriveFileOutlined, Close, CheckCircle } from '@mui/icons-material';
import { DEVICE_TYPES } from '@/constants/device';
import type { FirmwareChannel } from '@/types/ota';
import { tokens } from '@/theme/theme';

interface UploadFirmwareDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (input: { file: File; version: string; deviceType: string; channel: FirmwareChannel; sizeKb: number; releaseNotes: string }) => Promise<any>;
}

type Phase = 'form' | 'uploading' | 'done';

export default function UploadFirmwareDialog({ open, onClose, onUpload }: UploadFirmwareDialogProps) {
  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [version, setVersion] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [channel, setChannel] = useState<FirmwareChannel>('stable');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setPhase('form');
      setProgress(0);
      setFileName('');
      setVersion('');
      setDeviceType('');
      setChannel('stable');
      setReleaseNotes('');
      setFile(null);
    }
  }, [open]);

  const handlePickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bin';
    input.onchange = (e) => {
      const selectedFile = (e.target as HTMLInputElement).files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      }
    };
    input.click();
  };

  const canSubmit = file && fileName && version.trim() && deviceType && releaseNotes.trim();

  const handleSubmit = async () => {
    if (!file) return;
    setPhase('uploading');
    setProgress(0);
    
    // Fake progress interval while waiting for network
    const interval = setInterval(() => {
      setProgress((p) => Math.min(90, p + Math.floor(Math.random() * 15)));
    }, 500);

    try {
      await onUpload({
        file,
        version: version.trim(),
        deviceType,
        channel,
        sizeKb: Math.max(1, Math.ceil(file.size / 1024)),
        releaseNotes: releaseNotes.trim(),
      });
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setPhase('done'), 400);
    } catch (err) {
      clearInterval(interval);
      setPhase('form'); // Simplistic error handling
    }
  };

  return (
    <Dialog open={open} onClose={phase === 'uploading' ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Upload firmware
        {phase !== 'uploading' && (
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {phase === 'form' && (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box
              onClick={handlePickFile}
              sx={{
                border: `1.5px dashed ${tokens.surface.borderStrong}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: tokens.accent.main, bgcolor: `${tokens.accent.main}0A` },
              }}
            >
              {fileName ? (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <InsertDriveFileOutlined sx={{ color: tokens.accent.main, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                    {fileName}
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={0.75} alignItems="center">
                  <CloudUploadOutlined sx={{ color: tokens.text.tertiary, fontSize: 26 }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to select a .bin firmware image
                  </Typography>
                </Stack>
              )}
            </Box>

            <TextField
              label="Version"
              placeholder="v2.5.0"
              size="small"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Device type"
              size="small"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              fullWidth
            >
              {DEVICE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Release channel"
              size="small"
              value={channel}
              onChange={(e) => setChannel(e.target.value as FirmwareChannel)}
              fullWidth
            >
              <MenuItem value="stable">Stable</MenuItem>
              <MenuItem value="beta">Beta</MenuItem>
            </TextField>
            <TextField
              label="Release notes"
              size="small"
              multiline
              minRows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {phase === 'uploading' && (
          <Stack spacing={2} sx={{ py: 3 }} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Uploading {fileName}…
            </Typography>
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Typography variant="caption">{progress}%</Typography>
          </Stack>
        )}

        {phase === 'done' && (
          <Stack spacing={1.5} sx={{ py: 3 }} alignItems="center">
            <CheckCircle sx={{ color: tokens.status.online, fontSize: 40 }} />
            <Typography variant="subtitle1">Firmware uploaded</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {version} is now available in the firmware list and ready to deploy.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {phase === 'form' && (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
              Upload
            </Button>
          </>
        )}
        {phase === 'done' && (
          <Button variant="contained" onClick={onClose} fullWidth>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
