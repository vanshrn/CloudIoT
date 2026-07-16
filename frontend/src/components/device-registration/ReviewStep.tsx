import { Stack, Typography, Paper, Box, Button, Divider } from '@mui/material';
import { EditOutlined } from '@mui/icons-material';
import type { RegistrationFormData } from '@/types/registration';

interface ReviewStepProps {
  data: RegistrationFormData;
  onEditStep: (step: number) => void;
}

const CONNECTIVITY_LABELS: Record<RegistrationFormData['connectivity'], string> = {
  wifi: 'Wi-Fi',
  ethernet: 'Ethernet',
  cellular: 'Cellular',
  lorawan: 'LoRaWAN',
};

const VALIDITY_LABELS: Record<RegistrationFormData['certValidity'], string> = {
  '1y': '1 year',
  '2y': '2 years',
  '5y': '5 years',
};

function ReviewSection({ title, step, onEditStep, rows }: { title: string; step: number; onEditStep: (s: number) => void; rows: { label: string; value: string }[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1">{title}</Typography>
        <Button size="small" startIcon={<EditOutlined sx={{ fontSize: 15 }} />} onClick={() => onEditStep(step)}>
          Edit
        </Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {rows.map((row) => (
          <Stack key={row.label} spacing={0.25}>
            <Typography variant="caption" color="text.secondary">
              {row.label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {row.value || '—'}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Paper>
  );
}

export default function ReviewStep({ data, onEditStep }: ReviewStepProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Review everything below before registering the device. You can jump back to any step to make changes.
      </Typography>

      <ReviewSection
        title="Basic information"
        step={0}
        onEditStep={onEditStep}
        rows={[
          { label: 'Device name', value: data.name },
          { label: 'Device type', value: data.deviceType },
          { label: 'Group', value: data.group },
          { label: 'Location', value: data.location },
        ]}
      />

      <ReviewSection
        title="Certificates"
        step={1}
        onEditStep={onEditStep}
        rows={[
          { label: 'Method', value: data.certMethod === 'auto' ? 'Auto-generated' : 'Uploaded' },
          { label: 'Validity', value: VALIDITY_LABELS[data.certValidity] },
          ...(data.certMethod === 'upload'
            ? [
                { label: 'Certificate file', value: data.uploadedCertName },
                { label: 'Private key file', value: data.uploadedKeyName },
              ]
            : []),
        ]}
      />

      <ReviewSection
        title="Network configuration"
        step={2}
        onEditStep={onEditStep}
        rows={[
          { label: 'Connectivity', value: CONNECTIVITY_LABELS[data.connectivity] },
          ...(data.connectivity === 'wifi' ? [{ label: 'SSID', value: data.ssid }] : []),
          ...(data.connectivity === 'cellular' ? [{ label: 'APN', value: data.apn }] : []),
          ...(data.connectivity === 'ethernet'
            ? [{ label: 'IP assignment', value: data.useStaticIp ? `Static — ${data.staticIp}` : 'DHCP' }]
            : []),
          { label: 'MQTT broker', value: `${data.mqttEndpoint}:${data.mqttPort}` },
          { label: 'TLS', value: data.useTls ? 'Enabled' : 'Disabled' },
        ]}
      />

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Clicking <strong>Register device</strong> provisions the device record and issues its certificate. This is a
        simulated action — no real hardware is contacted.
      </Typography>
    </Stack>
  );
}
