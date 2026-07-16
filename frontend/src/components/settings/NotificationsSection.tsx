import { useState } from 'react';
import { Stack, Switch, FormControlLabel, Typography, Divider, Box } from '@mui/material';
import SettingsSection from './SettingsSection';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box sx={{ pr: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption">{description}</Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Stack>
  );
}

export default function NotificationsSection() {
  const [critical, setCritical] = useState(() => localStorage.getItem('notif_critical') !== 'false');
  const [warning, setWarning] = useState(() => localStorage.getItem('notif_warning') !== 'false');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('notif_critical', critical.toString());
    localStorage.setItem('notif_warning', warning.toString());
    
    // Dispatch an event so the Topbar can immediately react to the preference changes
    window.dispatchEvent(new Event('cloudiot_notif_prefs_changed'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SettingsSection title="Notifications" description="Choose which alerts appear in your notifications menu." onSave={handleSave} saved={saved}>
      <Typography variant="subtitle2">In-App Notifications</Typography>
      <ToggleRow label="Critical alerts" description="Show notifications when a critical alert is raised." checked={critical} onChange={setCritical} />
      <ToggleRow label="Warning alerts" description="Show notifications when a warning-level alert is raised." checked={warning} onChange={setWarning} />
    </SettingsSection>
  );
}
