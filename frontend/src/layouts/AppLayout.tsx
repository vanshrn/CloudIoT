import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { tokens } from '@/theme/theme';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Fleet Overview',
  '/devices': 'Devices',
  '/telemetry': 'Telemetry',
  '/alerts': 'Alerts',
  '/analytics': 'Analytics',
  '/ota-updates': 'OTA Updates',
  '/users': 'Users',
  '/settings': 'Settings',
};

function resolveTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path));
  return match ? PAGE_TITLES[match] : 'CloudIoT';
}

export default function AppLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', bgcolor: tokens.surface.canvas, height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={resolveTitle(location.pathname)} />
        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
