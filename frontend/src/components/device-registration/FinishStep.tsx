import { Stack, Typography, Box, Button } from '@mui/material';
import { CheckCircleOutlined } from '@mui/icons-material';
import { tokens } from '@/theme/theme';

interface FinishStepProps {
  deviceName: string;
  deviceId: string;
  credentials?: {
    certificatePem: string;
    privateKey: string;
  };
  onRegisterAnother: () => void;
  onDone: () => void;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FinishStep({ deviceName, deviceId, credentials, onRegisterAnother, onDone }: FinishStepProps) {
  return (
    <Stack alignItems="center" textAlign="center" spacing={2} sx={{ py: 3 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: `${tokens.status.online}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircleOutlined sx={{ fontSize: 36, color: tokens.status.online }} />
      </Box>
      <Stack spacing={0.5}>
        <Typography variant="h5">Device registered</Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={380}>
          <strong>{deviceName}</strong> has been added to your fleet with ID{' '}
          <Box component="span" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            {deviceId}
          </Box>
          . It will appear as online once it completes its first check-in.
        </Typography>
      </Stack>

      {credentials && (
        <Box sx={{ width: '100%', mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom color="error.main">
            Important: Download your credentials now
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The private key will <strong>never be shown again</strong>. Download both files and place them in your <code>simulator/certs/</code> folder or flash them to your device.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => downloadFile('device.pem.crt', credentials.certificatePem)}
            >
              Download Certificate
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => downloadFile('private.pem.key', credentials.privateKey)}
            >
              Download Private Key
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
        <Button variant="outlined" onClick={onRegisterAnother}>
          Register another device
        </Button>
        <Button variant="contained" onClick={onDone}>
          Done
        </Button>
      </Stack>
    </Stack>
  );
}
