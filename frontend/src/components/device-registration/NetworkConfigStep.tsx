import { Stack, Typography, ToggleButtonGroup, ToggleButton, TextField, Switch, FormControlLabel, Divider } from '@mui/material';
import { WifiOutlined, SettingsEthernetOutlined, SignalCellularAltOutlined, RouterOutlined } from '@mui/icons-material';
import type { RegistrationFormData, ConnectivityType } from '@/types/registration';

interface StepProps {
  data: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  update: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
}

const CONNECTIVITY_OPTIONS: { value: ConnectivityType; label: string; icon: typeof WifiOutlined }[] = [
  { value: 'wifi', label: 'Wi-Fi', icon: WifiOutlined },
  { value: 'ethernet', label: 'Ethernet', icon: SettingsEthernetOutlined },
  { value: 'cellular', label: 'Cellular', icon: SignalCellularAltOutlined },
  { value: 'lorawan', label: 'LoRaWAN', icon: RouterOutlined },
];

export default function NetworkConfigStep({ data, errors, update }: StepProps) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Choose how this device connects, then confirm the broker it will publish telemetry to.
      </Typography>

      <ToggleButtonGroup
        value={data.connectivity}
        exclusive
        onChange={(_, val) => val && update('connectivity', val)}
        sx={{ flexWrap: 'wrap' }}
      >
        {CONNECTIVITY_OPTIONS.map(({ value, label, icon: Icon }) => (
          <ToggleButton key={value} value={value} sx={{ gap: 1, px: 2 }}>
            <Icon fontSize="small" />
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {data.connectivity === 'wifi' && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Network SSID"
            value={data.ssid}
            onChange={(e) => update('ssid', e.target.value)}
            error={!!errors.ssid}
            helperText={errors.ssid}
            fullWidth
          />
          <TextField
            label="Wi-Fi password"
            type="password"
            value={data.wifiPassword}
            onChange={(e) => update('wifiPassword', e.target.value)}
            fullWidth
          />
        </Stack>
      )}

      {data.connectivity === 'cellular' && (
        <TextField
          label="APN"
          placeholder="e.g. iot.carrier.com"
          value={data.apn}
          onChange={(e) => update('apn', e.target.value)}
          error={!!errors.apn}
          helperText={errors.apn}
          fullWidth
        />
      )}

      {data.connectivity === 'ethernet' && (
        <>
          <FormControlLabel
            control={<Switch checked={data.useStaticIp} onChange={(e) => update('useStaticIp', e.target.checked)} />}
            label="Use static IP (otherwise DHCP-assigned)"
          />
          {data.useStaticIp && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Static IP address"
                placeholder="10.0.4.21"
                value={data.staticIp}
                onChange={(e) => update('staticIp', e.target.value)}
                error={!!errors.staticIp}
                helperText={errors.staticIp}
                fullWidth
              />
              <TextField
                label="Subnet mask"
                value={data.subnetMask}
                onChange={(e) => update('subnetMask', e.target.value)}
                fullWidth
              />
              <TextField
                label="Gateway"
                placeholder="10.0.4.1"
                value={data.gateway}
                onChange={(e) => update('gateway', e.target.value)}
                error={!!errors.gateway}
                helperText={errors.gateway}
                fullWidth
              />
            </Stack>
          )}
        </>
      )}

      {data.connectivity === 'lorawan' && (
        <Typography variant="caption" color="text.secondary">
          Join credentials (DevEUI, AppEUI, AppKey) will be generated automatically and provisioned to the network
          server on Finish.
        </Typography>
      )}

      <Divider />

      <Typography variant="subtitle2">Telemetry broker</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="MQTT broker endpoint"
          value={data.mqttEndpoint}
          onChange={(e) => update('mqttEndpoint', e.target.value)}
          error={!!errors.mqttEndpoint}
          helperText={errors.mqttEndpoint}
          fullWidth
        />
        <TextField
          label="Port"
          value={data.mqttPort}
          onChange={(e) => update('mqttPort', e.target.value)}
          error={!!errors.mqttPort}
          helperText={errors.mqttPort}
          sx={{ maxWidth: { sm: 140 } }}
        />
      </Stack>
      <FormControlLabel
        control={<Switch checked={data.useTls} onChange={(e) => update('useTls', e.target.checked)} />}
        label="Encrypt connection with TLS"
      />
    </Stack>
  );
}
