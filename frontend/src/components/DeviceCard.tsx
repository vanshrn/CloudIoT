import { useState } from 'react';
import { Paper, Stack, Typography, Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, LinearProgress } from '@mui/material';
import {
  MoreVert,
  OpenInNewOutlined,
  SystemUpdateAltOutlined,
  RestartAltOutlined,
  DeleteOutline,
  PlaceOutlined,
  BatteryFull,
  Battery60,
  Battery20,
  ThermostatOutlined,
  WaterDropOutlined,
  SignalCellularAltOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Device } from '@/types/device';
import { DeviceStatusChip } from './StatusChip';
import { tokens } from '@/theme/theme';

interface DeviceCardProps {
  device: Device;
  onOta: (device: Device) => void;
  onRestart: (device: Device) => void;
  onDelete: (device: Device) => void;
  canOta?: boolean;
  canRestart?: boolean;
  canDelete?: boolean;
}

function batteryIcon(pct: number) {
  if (pct > 60) return BatteryFull;
  if (pct > 25) return Battery60;
  return Battery20;
}

function batteryColor(pct: number) {
  if (pct > 60) return tokens.status.online;
  if (pct > 25) return tokens.status.warning;
  return tokens.status.critical;
}

export default function DeviceCard({ device, onOta, onRestart, onDelete, canOta = true, canRestart = true, canDelete = true }: DeviceCardProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const BatteryIcon = batteryIcon(device.batteryPct);

  const openDevice = () => navigate(`/devices/${device.id}`);

  return (
    <Paper
      sx={{
        p: 2.25,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        cursor: 'pointer',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          borderColor: tokens.accent.main,
          boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
        },
      }}
      onClick={openDevice}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.4} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {device.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <PlaceOutlined sx={{ fontSize: 14, color: tokens.text.tertiary }} />
            <Typography variant="caption" noWrap>
              {device.location}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <DeviceStatusChip status={device.status} />
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                openDevice();
              }}
            >
              <ListItemIcon>
                <OpenInNewOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Open</ListItemText>
            </MenuItem>
            {canOta && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onOta(device);
                }}
              >
                <ListItemIcon>
                  <SystemUpdateAltOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>OTA update</ListItemText>
              </MenuItem>
            )}
            {canRestart && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onRestart(device);
                }}
              >
                <ListItemIcon>
                  <RestartAltOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Restart</ListItemText>
              </MenuItem>
            )}
            {canDelete && <Divider />}
            {canDelete && (
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    onDelete(device);
                  }}
                  sx={{ color: tokens.status.critical }}
                >
                  <ListItemIcon>
                    <DeleteOutline fontSize="small" sx={{ color: tokens.status.critical }} />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
            )}
          </Menu>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          bgcolor: tokens.surface.canvas,
          borderRadius: 2,
          p: 1.25,
        }}
      >
        <Stack alignItems="center" spacing={0.25}>
          <ThermostatOutlined sx={{ fontSize: 16, color: tokens.text.tertiary }} />
          <Typography variant="body2" fontWeight={600}>
            {device.temperatureC}°C
          </Typography>
        </Stack>
        <Stack alignItems="center" spacing={0.25}>
          <WaterDropOutlined sx={{ fontSize: 16, color: tokens.text.tertiary }} />
          <Typography variant="body2" fontWeight={600}>
            {device.humidityPct}%
          </Typography>
        </Stack>
        <Stack alignItems="center" spacing={0.25}>
          <SignalCellularAltOutlined sx={{ fontSize: 16, color: tokens.text.tertiary }} />
          <Typography variant="body2" fontWeight={600}>
            {device.rssiDbm} dBm
          </Typography>
        </Stack>
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <BatteryIcon sx={{ fontSize: 15, color: batteryColor(device.batteryPct) }} />
            <Typography variant="caption">Battery</Typography>
          </Stack>
          <Typography variant="caption" fontWeight={600}>
            {device.batteryPct}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={device.batteryPct}
          sx={{
            height: 5,
            borderRadius: 5,
            bgcolor: '#EEF0F3',
            '& .MuiLinearProgress-bar': { bgcolor: batteryColor(device.batteryPct), borderRadius: 5 },
          }}
        />
      </Box>

      <Divider />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="caption"
          sx={{ fontFamily: '"IBM Plex Mono", monospace', bgcolor: tokens.surface.canvas, px: 0.75, py: 0.25, borderRadius: 1 }}
        >
          {device.firmwareVersion}
        </Typography>
        <Typography variant="caption">{formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}</Typography>
      </Stack>
    </Paper>
  );
}
