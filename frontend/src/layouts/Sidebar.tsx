import { Box, Stack, Typography, Avatar } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  MemoryOutlined,
  ShowChartOutlined,
  NotificationsActiveOutlined,
  InsightsOutlined,
  SystemUpdateAltOutlined,
  GroupOutlined,
  SettingsOutlined,
  Cloud,
} from '@mui/icons-material';
import { tokens } from '@/theme/theme';
import { useAuth } from '@/auth/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: DashboardOutlined },
  { label: 'Devices', to: '/devices', icon: MemoryOutlined },
  { label: 'Telemetry', to: '/telemetry', icon: ShowChartOutlined },
  { label: 'Alerts', to: '/alerts', icon: NotificationsActiveOutlined },
  { label: 'Analytics', to: '/analytics', icon: InsightsOutlined },
  { label: 'OTA Updates', to: '/ota-updates', icon: SystemUpdateAltOutlined },
  { label: 'Users', to: '/users', icon: GroupOutlined },
  { label: 'Settings', to: '/settings', icon: SettingsOutlined },
];

export const SIDEBAR_WIDTH = 248;

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const name = user?.name || 'User';
  const role = user?.role || 'Viewer';
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: tokens.sidebar.bg,
        color: tokens.sidebar.text,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: `1px solid ${tokens.sidebar.border}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 2.75 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: tokens.accent.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Cloud sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Typography sx={{ color: tokens.sidebar.textActive, fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          CloudIoT
        </Typography>
      </Stack>

      <Stack spacing={0.5} sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Box
              key={to}
              component={NavLink}
              to={to}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.1,
                borderRadius: 2,
                textDecoration: 'none',
                color: active ? tokens.sidebar.textActive : tokens.sidebar.text,
                bgcolor: active ? tokens.sidebar.activeBg : 'transparent',
                fontWeight: active ? 600 : 500,
                fontSize: '0.875rem',
                transition: 'background-color 120ms ease, color 120ms ease',
                '&:hover': {
                  bgcolor: active ? tokens.sidebar.activeBg : 'rgba(255,255,255,0.06)',
                  color: tokens.sidebar.textActive,
                },
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              {label}
            </Box>
          );
        })}
      </Stack>


      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 2, py: 2, borderTop: `1px solid ${tokens.sidebar.border}` }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: tokens.accent.main, fontSize: '0.8rem' }}>{initials}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ color: tokens.sidebar.textActive, fontWeight: 600 }}>
            {name}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: tokens.sidebar.text }}>
            {role}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
