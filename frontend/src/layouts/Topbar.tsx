import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  InputBase,
  Badge,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Search, NotificationsNoneOutlined, Logout, Settings, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/theme/theme';
import { useAuth } from '@/auth/AuthContext';
import { listAlerts } from '@/api/alerts';
import type { DeviceAlert } from '@/types/alert';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [prefsSerial, setPrefsSerial] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await listAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch notifications for topbar:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    
    const handlePrefs = () => setPrefsSerial((s) => s + 1);
    window.addEventListener('cloudiot_notif_prefs_changed', handlePrefs);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cloudiot_notif_prefs_changed', handlePrefs);
    };
  }, [fetchNotifications]);

  const showCritical = localStorage.getItem('notif_critical') !== 'false';
  const showWarning = localStorage.getItem('notif_warning') !== 'false';

  const filteredAlerts = alerts.filter((a) => {
    if (a.status !== 'open') return false;
    if (a.severity === 'critical' && !showCritical) return false;
    if (a.severity === 'warning' && !showWarning) return false;
    return true;
  });

  const name = user?.name || 'User';
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: tokens.surface.card,
        borderBottom: `1px solid ${tokens.surface.border}`,
        px: 3,
        py: 1.75,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>
          {title}
        </Typography>



        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
            <Badge variant="dot" color="error" invisible={filteredAlerts.length === 0}>
              <NotificationsNoneOutlined />
            </Badge>
          </IconButton>
          
          <Menu 
            anchorEl={notifAnchorEl} 
            open={!!notifAnchorEl} 
            onClose={() => setNotifAnchorEl(null)}
            slotProps={{ paper: { sx: { width: 320, maxHeight: 400 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
            </Box>
            <Divider />
            {filteredAlerts.length === 0 ? (
              <MenuItem disabled sx={{ py: 3, justifyContent: 'center' }}>
                <Typography variant="body2">No new notifications</Typography>
              </MenuItem>
            ) : (
              filteredAlerts.slice(0, 5).map(alert => (
                <MenuItem key={alert.id} onClick={() => { setNotifAnchorEl(null); navigate('/alerts'); }}>
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {alert.severity === 'critical' ? '🔴 Critical' : '🟠 Warning'}: {alert.deviceName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                      {alert.message}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))
            )}
            {filteredAlerts.length > 5 && (
              <>
                <Divider />
                <MenuItem onClick={() => { setNotifAnchorEl(null); navigate('/alerts'); }} sx={{ justifyContent: 'center' }}>
                  <Typography variant="body2" color="primary">View all alerts</Typography>
                </MenuItem>
              </>
            )}
          </Menu>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.25 }}>
            <Avatar src={user?.picture} sx={{ width: 32, height: 32, bgcolor: tokens.accent.main, fontSize: '0.8rem' }}>
              {!user?.picture && initials}
            </Avatar>
          </IconButton>
          <Menu 
            anchorEl={anchorEl} 
            open={!!anchorEl} 
            onClose={() => setAnchorEl(null)}
            slotProps={{ paper: { sx: { mt: 1.5, minWidth: 160 } } }}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate('/settings');
              }}
            >
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                signOut();
                navigate('/login', { replace: true });
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign out</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>
    </Box>
  );
}
