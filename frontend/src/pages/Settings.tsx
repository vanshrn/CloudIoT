import { useState } from 'react';
import { Stack, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import {
  PersonOutline,
  BusinessOutlined,
  NotificationsNoneOutlined,
  PaletteOutlined,
  SecurityOutlined,
  VpnKeyOutlined,
} from '@mui/icons-material';
import ProfileSection from '@/components/settings/ProfileSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import AppearanceSection from '@/components/settings/AppearanceSection';
import SecuritySection from '@/components/settings/SecuritySection';
import { tokens } from '@/theme/theme';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

const NAV_ITEMS: { value: SettingsTab; label: string; icon: typeof PersonOutline }[] = [
  { value: 'profile', label: 'Profile', icon: PersonOutline },
  { value: 'notifications', label: 'Notifications', icon: NotificationsNoneOutlined },
  { value: 'appearance', label: 'Appearance', icon: PaletteOutlined },
  { value: 'security', label: 'Security', icon: SecurityOutlined },
];

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('profile');

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your profile, organization, and account preferences.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Paper sx={{ borderRadius: 3, width: { xs: '100%', md: 240 }, flexShrink: 0, overflow: 'hidden' }}>
          <List sx={{ py: 1 }}>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.value}
                selected={tab === item.value}
                onClick={() => setTab(item.value)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.25,
                  '&.Mui-selected': {
                    bgcolor: `${tokens.accent.main}14`,
                    color: tokens.accent.main,
                    '& .MuiListItemIcon-root': { color: tokens.accent.main },
                    '&:hover': { bgcolor: `${tokens.accent.main}1F` },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}>{item.label}</ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          {tab === 'profile' && <ProfileSection />}
          {tab === 'notifications' && <NotificationsSection />}
          {tab === 'appearance' && <AppearanceSection />}
          {tab === 'security' && <SecuritySection />}
        </Box>
      </Stack>
    </Stack>
  );
}
