import { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import DeviceCard from '@/components/DeviceCard';
import DeviceCardSkeleton from '@/components/DeviceCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import DeviceRegistrationWizard from '@/components/device-registration/DeviceRegistrationWizard';
import { useDevices } from '@/hooks/useDevices';
import { useAuth } from '@/auth/AuthContext';
import { deleteDevice as apiDeleteDevice } from '@/api/devices';
import type { Device, DeviceStatus } from '@/types/device';
import { tokens } from '@/theme/theme';

type SortKey = 'name' | 'status' | 'battery' | 'lastSeen' | 'temperature';
type StatusFilter = 'all' | DeviceStatus;

const PAGE_SIZE = 12;

export default function Devices() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isOperator = user?.role === 'Operator';
  const canEdit = isAdmin || isOperator;

  const { devices, loading, error, refetch, removeDevice, addDevice } = useDevices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [page, setPage] = useState(1);

  const [pendingAction, setPendingAction] = useState<{ type: 'ota' | 'restart' | 'delete'; device: Device } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const groups = useMemo(() => Array.from(new Set(devices.map((d) => d.group))).sort(), [devices]);

  const filtered = useMemo(() => {
    let result = devices;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => (d.name || '').toLowerCase().includes(q) || (d.location || '').toLowerCase().includes(q) || (d.id || '').includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (groupFilter !== 'all') {
      result = result.filter((d) => d.group === groupFilter);
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'battery':
          return b.batteryPct - a.batteryPct;
        case 'temperature':
          return b.temperatureC - a.temperatureC;
        case 'lastSeen':
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [devices, search, statusFilter, groupFilter, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setGroupFilter('all');
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === 'delete') {
        await apiDeleteDevice(pendingAction.device.id);
        removeDevice(pendingAction.device.id);
      }
      // 'ota' and 'restart' are simulated — a real backend call would go here.
    } catch {
      // Keep the dialog open on failure so the user sees it didn't work.
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    setPendingAction(null);
  };

  return (
    <Stack spacing={2.5}>
      {/* API error banner */}
      {error && (
        <Alert severity="error" onClose={() => void refetch()}>
          {error}
        </Alert>
      )}
      {/* Toolbar */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ overflowX: 'auto', pt: 1, pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 'max-content' }}>
          <TextField
            size="small"
            placeholder="Search by name, location, or ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: { sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: tokens.text.tertiary }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group</InputLabel>
            <Select
              label="Group"
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All groups</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select label="Sort by" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="battery">Battery</MenuItem>
              <MenuItem value="temperature">Temperature</MenuItem>
              <MenuItem value="lastSeen">Last seen</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {canEdit && (
          <Button variant="contained" startIcon={<Add />} sx={{ flexShrink: 0 }} onClick={() => setWizardOpen(true)}>
            Register device
          </Button>
        )}
      </Stack>

      {/* Status filter chips */}
      <ToggleButtonGroup
        value={statusFilter}
        exclusive
        size="small"
        onChange={(_, val) => {
          if (val !== null) {
            setStatusFilter(val);
            setPage(1);
          }
        }}
        sx={{ alignSelf: 'flex-start', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <ToggleButton value="all">All ({devices.length})</ToggleButton>
        <ToggleButton value="online">Online ({devices.filter((d) => d.status === 'online').length})</ToggleButton>
        <ToggleButton value="warning">Warning ({devices.filter((d) => d.status === 'warning').length})</ToggleButton>
        <ToggleButton value="offline">Offline ({devices.filter((d) => d.status === 'offline').length})</ToggleButton>
      </ToggleButtonGroup>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr', xl: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No devices match your filters"
          description="Try adjusting your search term, status filter, or group filter to see more devices."
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr', xl: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            {pageItems.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onOta={(d) => setPendingAction({ type: 'ota', device: d })}
                onRestart={(d) => setPendingAction({ type: 'restart', device: d })}
                onDelete={(d) => setPendingAction({ type: 'delete', device: d })}
                canOta={canEdit}
                canRestart={canEdit}
                canDelete={canEdit}
              />
            ))}
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
            <Typography variant="caption">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} devices
            </Typography>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
          </Stack>
        </>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        loading={actionLoading}
        title={
          pendingAction?.type === 'ota'
            ? 'Deploy OTA update?'
            : pendingAction?.type === 'restart'
              ? 'Restart device?'
              : 'Delete device?'
        }
        description={
          pendingAction?.type === 'ota'
            ? `This will push the latest firmware to ${pendingAction.device.name}. The device will reboot once the update completes.`
            : pendingAction?.type === 'restart'
              ? `${pendingAction?.device.name} will restart and be briefly offline. Continue?`
              : `This permanently removes ${pendingAction?.device.name} from your fleet. This can't be undone.`
        }
        confirmLabel={pendingAction?.type === 'ota' ? 'Deploy update' : pendingAction?.type === 'restart' ? 'Restart' : 'Delete device'}
        destructive={pendingAction?.type === 'delete'}
        onConfirm={handleConfirmAction}
        onClose={() => setPendingAction(null)}
      />

      <DeviceRegistrationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onRegister={(device) => {
          addDevice(device);
          void refetch();
          setSearch('');
          setStatusFilter('all');
          setGroupFilter('all');
          setPage(1);
        }}
      />
    </Stack>
  );
}
