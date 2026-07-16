import { Stack, TextField, MenuItem, FormControl, InputLabel, Select, Typography } from '@mui/material';
import { DEVICE_TYPES, GROUPS, LOCATIONS } from '@/constants/device';
import type { RegistrationFormData } from '@/types/registration';

interface StepProps {
  data: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  update: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
}

export default function BasicInfoStep({ data, errors, update }: StepProps) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Give the device a name and tell us where it lives in your fleet.
      </Typography>

      <TextField
        label="Device name"
        placeholder="e.g. Sensor-142"
        value={data.name}
        onChange={(e) => update('name', e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        autoFocus
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth error={!!errors.deviceType}>
          <InputLabel>Device type</InputLabel>
          <Select label="Device type" value={data.deviceType} onChange={(e) => update('deviceType', e.target.value)}>
            {DEVICE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth error={!!errors.group}>
          <InputLabel>Group</InputLabel>
          <Select label="Group" value={data.group} onChange={(e) => update('group', e.target.value)}>
            {GROUPS.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <FormControl fullWidth error={!!errors.location}>
        <InputLabel>Location</InputLabel>
        <Select label="Location" value={data.location} onChange={(e) => update('location', e.target.value)}>
          {LOCATIONS.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Description (optional)"
        placeholder="Any notes about this device's purpose or install context"
        value={data.description}
        onChange={(e) => update('description', e.target.value)}
        fullWidth
        multiline
        minRows={3}
      />
    </Stack>
  );
}
