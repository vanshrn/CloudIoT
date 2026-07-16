import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Box,
  Stack,
  Typography,
  MenuItem,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Close, Search, MemoryOutlined } from '@mui/icons-material';
import type { Firmware } from '@/types/ota';
import type { NewDeploymentInput } from '@/hooks/useOta';
import { useDevices } from '@/hooks/useDevices';
import { FirmwareChannelChip } from '@/components/StatusChip';
import { tokens } from '@/theme/theme';

const STEP_LABELS = ['Firmware', 'Target', 'Schedule & review'];

type TargetMode = 'all' | 'group' | 'devices';

interface DeploymentDialogProps {
  open: boolean;
  firmwares: Firmware[];
  presetFirmware: Firmware | null;
  onClose: () => void;
  onDeploy: (input: NewDeploymentInput) => void;
}

export default function DeploymentDialog({ open, firmwares, presetFirmware, onClose, onDeploy }: DeploymentDialogProps) {
  const { devices, refetch } = useDevices();
  const GROUPS = useMemo(() => Array.from(new Set(devices.map((d) => d.group).filter(Boolean))), [devices]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [firmwareId, setFirmwareId] = useState('');
  const [targetMode, setTargetMode] = useState<TargetMode>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledFor, setScheduledFor] = useState('');

  useEffect(() => {
    if (open) {
      void refetch();
      setActiveStep(0);
      setFirmwareId(presetFirmware?.id ?? '');
      setTargetMode('group');
      setSelectedGroup('');
      setDeviceSearch('');
      setSelectedDeviceIds([]);
      setMode('immediate');
      setScheduledFor('');
    }
  }, [open, presetFirmware]);

  const firmware = useMemo(() => firmwares.find((f) => f.id === firmwareId) ?? null, [firmwares, firmwareId]);

  const eligibleDevices = useMemo(
    () => (firmware ? devices.filter((d) => d.deviceType === firmware.deviceType) : []),
    [firmware, devices],
  );

  const filteredDevices = useMemo(() => {
    if (!deviceSearch.trim()) return eligibleDevices;
    const q = deviceSearch.trim().toLowerCase();
    return eligibleDevices.filter((d) => d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q));
  }, [eligibleDevices, deviceSearch]);

  const targetSummary = useMemo(() => {
    if (targetMode === 'all') return { label: `All ${firmware?.deviceType ?? 'devices'} (${eligibleDevices.length} devices)`, count: eligibleDevices.length };
    if (targetMode === 'group') {
      const count = eligibleDevices.filter((d) => d.group === selectedGroup).length;
      return { label: `${selectedGroup || '—'} (${count} devices)`, count };
    }
    return { label: `${selectedDeviceIds.length} devices`, count: selectedDeviceIds.length };
  }, [targetMode, firmware, eligibleDevices, selectedGroup, selectedDeviceIds]);

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const stepValid = (step: number) => {
    if (step === 0) return !!firmwareId;
    if (step === 1) {
      if (targetMode === 'all') return eligibleDevices.length > 0;
      if (targetMode === 'group') return !!selectedGroup;
      return selectedDeviceIds.length > 0;
    }
    if (step === 2) return mode === 'immediate' || !!scheduledFor;
    return true;
  };

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const handleDeploy = () => {
    let targetDeviceIds: string[] = [];
    if (targetMode === 'all') targetDeviceIds = eligibleDevices.map(d => d.id);
    else if (targetMode === 'group') targetDeviceIds = eligibleDevices.filter(d => d.group === selectedGroup).map(d => d.id);
    else targetDeviceIds = selectedDeviceIds;

    onDeploy({
      firmwareId,
      target: targetMode,
      targetLabel: targetSummary.label,
      deviceCount: targetSummary.count,
      targetDeviceIds,
      mode,
      scheduledFor: mode === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Deploy firmware
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEP_LABELS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 340 }}>
        {activeStep === 0 && (
          <Stack spacing={2}>
            <TextField select label="Firmware" size="small" value={firmwareId} onChange={(e) => setFirmwareId(e.target.value)} fullWidth>
              {firmwares
                .filter((f) => f.channel !== 'deprecated')
                .map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.version} — {f.deviceType}
                  </MenuItem>
                ))}
            </TextField>
            {firmware && (
              <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${tokens.surface.border}` }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MemoryOutlined sx={{ fontSize: 18, color: tokens.accent.main }} />
                  <Typography variant="subtitle2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                    {firmware.version}
                  </Typography>
                  <FirmwareChannelChip channel={firmware.channel} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {firmware.releaseNotes}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2}>
            <RadioGroup row value={targetMode} onChange={(e) => setTargetMode(e.target.value as TargetMode)}>
              <FormControlLabel value="all" control={<Radio size="small" />} label="All eligible devices" />
              <FormControlLabel value="group" control={<Radio size="small" />} label="A group" />
              <FormControlLabel value="devices" control={<Radio size="small" />} label="Specific devices" />
            </RadioGroup>

            {targetMode === 'group' && (
              <TextField select label="Group" size="small" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                {GROUPS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {targetMode === 'devices' && (
              <Stack spacing={1}>
                <TextField
                  size="small"
                  placeholder="Search eligible devices…"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: tokens.text.tertiary }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <List
                  dense
                  sx={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${tokens.surface.border}`, borderRadius: 2 }}
                >
                  {filteredDevices.map((d) => (
                    <ListItem key={d.id} onClick={() => toggleDevice(d.id)} sx={{ cursor: 'pointer' }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox edge="start" size="small" checked={selectedDeviceIds.includes(d.id)} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText primary={d.name} secondary={d.location} />
                    </ListItem>
                  ))}
                  {filteredDevices.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No eligible devices match your search" />
                    </ListItem>
                  )}
                </List>
              </Stack>
            )}

            <Typography variant="caption">
              {eligibleDevices.length} device(s) run {firmware?.deviceType ?? 'this device type'} and are eligible for this firmware.
            </Typography>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as 'immediate' | 'scheduled')}>
              <FormControlLabel value="immediate" control={<Radio size="small" />} label="Deploy immediately" />
              <FormControlLabel value="scheduled" control={<Radio size="small" />} label="Schedule for later" />
            </RadioGroup>

            {mode === 'scheduled' && (
              <TextField
                label="Scheduled date & time"
                type="datetime-local"
                size="small"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Review</Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Firmware</Typography>
                <Typography variant="body2" fontWeight={600}>{firmware?.version}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Target</Typography>
                <Typography variant="body2" fontWeight={600}>{targetSummary.label}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Deployment</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {mode === 'immediate' ? 'Immediate' : scheduledFor ? new Date(scheduledFor).toLocaleString() : '—'}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < 2 && (
          <Button variant="contained" disabled={!stepValid(activeStep)} onClick={handleNext}>
            Next
          </Button>
        )}
        {activeStep === 2 && (
          <Button variant="contained" disabled={!stepValid(2)} onClick={handleDeploy}>
            Deploy
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
