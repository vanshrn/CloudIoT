import { useState } from 'react';
import { Stack, Typography, ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import { LightModeOutlined, DarkModeOutlined, SettingsBrightnessOutlined } from '@mui/icons-material';
import SettingsSection from './SettingsSection';
import { tokens } from '@/theme/theme';

const ACCENT_OPTIONS = [
  { name: 'Signal blue', color: tokens.accent.main },
  { name: 'Emerald', color: '#12B76A' },
  { name: 'Violet', color: '#7C5CFC' },
  { name: 'Amber', color: '#F79009' },
];

export default function AppearanceSection() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme_mode') || 'light');
  const [density, setDensity] = useState(() => localStorage.getItem('theme_density') || 'comfortable');
  const [accent, setAccent] = useState(() => {
    const saved = localStorage.getItem('theme_accent');
    if (!saved || saved.startsWith('var(')) return '#4F7CFF';
    return saved;
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('theme_mode', themeMode);
    localStorage.setItem('theme_density', density);
    localStorage.setItem('theme_accent', accent);
    
    window.dispatchEvent(new Event('cloudiot_appearance_changed'));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SettingsSection title="Appearance" description="Customize how the CloudIoT console looks for you." onSave={handleSave} saved={saved}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Theme</Typography>
        <ToggleButtonGroup value={themeMode} exclusive size="small" onChange={(_, v) => v && setThemeMode(v)}>
          <ToggleButton value="light">
            <LightModeOutlined fontSize="small" sx={{ mr: 1 }} /> Light
          </ToggleButton>
          <ToggleButton value="dark">
            <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} /> Dark
          </ToggleButton>
          <ToggleButton value="system">
            <SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} /> System
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption">Dark mode is in preview — some pages may not be fully styled yet.</Typography>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Density</Typography>
        <ToggleButtonGroup value={density} exclusive size="small" onChange={(_, v) => v && setDensity(v)}>
          <ToggleButton value="comfortable">Comfortable</ToggleButton>
          <ToggleButton value="compact">Compact</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Accent color</Typography>
        <Stack direction="row" spacing={1.5}>
          {ACCENT_OPTIONS.map((opt) => (
            <Box
              key={opt.color}
              onClick={() => setAccent(opt.color)}
              title={opt.name}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: opt.color,
                cursor: 'pointer',
                border: accent === opt.color ? `2px solid ${tokens.text.primary}` : '2px solid transparent',
                outline: `2px solid ${tokens.surface.border}`,
                outlineOffset: 2,
              }}
            />
          ))}
        </Stack>
      </Stack>
    </SettingsSection>
  );
}
