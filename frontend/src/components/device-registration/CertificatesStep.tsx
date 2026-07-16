import { Stack, Typography, RadioGroup, FormControlLabel, Radio, Paper, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, Chip } from '@mui/material';
import { UploadFileOutlined, VerifiedUserOutlined, InsertDriveFileOutlined } from '@mui/icons-material';
import { tokens } from '@/theme/theme';
import type { RegistrationFormData } from '@/types/registration';

interface StepProps {
  data: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  update: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
}

export default function CertificatesStep({ data, errors, update }: StepProps) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Every device needs an X.509 certificate to authenticate with CloudIoT. Auto-generate one, or upload an
        existing cert/key pair.
      </Typography>

      <RadioGroup
        value={data.certMethod}
        onChange={(e) => update('certMethod', e.target.value as RegistrationFormData['certMethod'])}
      >
        <FormControlLabel value="auto" control={<Radio />} label="Auto-generate certificate (recommended)" />
        <FormControlLabel value="upload" control={<Radio />} label="Upload an existing certificate and private key" />
      </RadioGroup>

      {data.certMethod === 'auto' ? (
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: tokens.surface.canvas }}
        >
          <VerifiedUserOutlined sx={{ color: tokens.status.online }} />
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              A new certificate and private key will be generated on Finish
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You'll be able to download the private key once — CloudIoT never stores a copy.
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileOutlined />}
              sx={{ flex: 1, justifyContent: 'flex-start' }}
            >
              {data.uploadedCertName || 'Upload certificate (.pem, .crt)'}
              <input
                type="file"
                hidden
                accept=".pem,.crt,.cer"
                onChange={(e) => update('uploadedCertName', e.target.files?.[0]?.name ?? '')}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileOutlined />}
              sx={{ flex: 1, justifyContent: 'flex-start' }}
            >
              {data.uploadedKeyName || 'Upload private key (.key)'}
              <input
                type="file"
                hidden
                accept=".key,.pem"
                onChange={(e) => update('uploadedKeyName', e.target.files?.[0]?.name ?? '')}
              />
            </Button>
          </Stack>
          {(errors.uploadedCertName || errors.uploadedKeyName) && (
            <Typography variant="caption" color="error">
              {errors.uploadedCertName || errors.uploadedKeyName}
            </Typography>
          )}
          {data.uploadedCertName && (
            <Chip
              size="small"
              icon={<InsertDriveFileOutlined sx={{ fontSize: 14 }} />}
              label={data.uploadedCertName}
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
        </Stack>
      )}

      <FormControl sx={{ maxWidth: 240 }}>
        <InputLabel>Certificate validity</InputLabel>
        <Select
          label="Certificate validity"
          value={data.certValidity}
          onChange={(e) => update('certValidity', e.target.value as RegistrationFormData['certValidity'])}
        >
          <MenuItem value="1y">1 year</MenuItem>
          <MenuItem value="2y">2 years</MenuItem>
          <MenuItem value="5y">5 years</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={data.keyStoredConfirmed}
            onChange={(e) => update('keyStoredConfirmed', e.target.checked)}
          />
        }
        label="I understand I'm responsible for securely storing the private key"
      />
      {errors.keyStoredConfirmed && (
        <Typography variant="caption" color="error" sx={{ mt: -1.5 }}>
          {errors.keyStoredConfirmed}
        </Typography>
      )}
    </Stack>
  );
}
