import { Paper, Stack, Typography, Box, Button, Chip } from '@mui/material';
import { MemoryOutlined, RocketLaunchOutlined } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { Firmware } from '@/types/ota';
import { FirmwareChannelChip } from '@/components/StatusChip';
import { tokens } from '@/theme/theme';

interface FirmwareCardProps {
  firmware: Firmware;
  onDeploy?: (firmware: Firmware) => void;
}

export default function FirmwareCard({ firmware, onDeploy }: FirmwareCardProps) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: `${tokens.accent.main}1A`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MemoryOutlined sx={{ color: tokens.accent.main, fontSize: 19 }} />
          </Box>
          <Stack spacing={0.1}>
            <Typography variant="subtitle1" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.9375rem' }}>
              {firmware.version}
            </Typography>
            <Typography variant="caption">{firmware.deviceType}</Typography>
          </Stack>
        </Stack>
        <FirmwareChannelChip channel={firmware.channel} />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {firmware.releaseNotes}
      </Typography>

      <Stack direction="row" spacing={0.75} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={`${firmware.sizeKb} KB`} />
        <Chip size="small" variant="outlined" label={`${firmware.installCount} devices installed`} />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 0.5 }}>
        <Typography variant="caption">
          Released {formatDistanceToNow(new Date(firmware.releasedAt), { addSuffix: true })}
        </Typography>
        {onDeploy && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<RocketLaunchOutlined sx={{ fontSize: 16 }} />}
            disabled={firmware.channel === 'deprecated'}
            onClick={() => onDeploy(firmware)}
          >
            Deploy
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
