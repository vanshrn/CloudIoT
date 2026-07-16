import { useMemo, useState } from 'react';
import {
  Stack,
  Box,
  Paper,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Typography,
  Skeleton,
  Menu,
  Alert,
} from '@mui/material';
import { Search, Visibility, CheckCircleOutline, TaskAltOutlined, MoreVert } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/auth/AuthContext';
import { SeverityChip, AlertStatusChip } from '@/components/StatusChip';
import AlertDetailsDialog from '@/components/AlertDetailsDialog';
import EmptyState from '@/components/EmptyState';
import type { DeviceAlert, AlertSeverity, AlertStatus } from '@/types/alert';
import { tokens } from '@/theme/theme';

type SeverityFilter = 'all' | AlertSeverity;
type StatusFilter = 'all' | AlertStatus;
type SortKey = 'newest' | 'oldest' | 'severity';

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export default function Alerts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isOperator = user?.role === 'Operator';
  const canEdit = isAdmin || isOperator;
  const { alerts, loading, error, refetch, acknowledgeAlert, resolveAlert } = useAlerts();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [viewingAlert, setViewingAlert] = useState<DeviceAlert | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; alert: DeviceAlert } | null>(null);

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
      warning: alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length,
      info: alerts.filter((a) => a.severity === 'info' && a.status !== 'resolved').length,
    }),
    [alerts],
  );

  const filtered = useMemo(() => {
    let result = alerts;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => a.deviceName.toLowerCase().includes(q) || a.message.toLowerCase().includes(q));
    }
    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'severity':
          return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
        default:
          return 0;
      }
    });
  }, [alerts, search, severityFilter, statusFilter, sortKey]);

  const resetFilters = () => {
    setSearch('');
    setSeverityFilter('all');
    setStatusFilter('all');
  };

  return (
    <Stack spacing={2.5}>
      {/* API error banner */}
      {error && (
        <Alert severity="error" onClose={() => void refetch()}>
          {error}
        </Alert>
      )}

      {/* Severity summary chips */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        {(['critical', 'warning', 'info'] as AlertSeverity[]).map((sev) => (
          <Paper
            key={sev}
            onClick={() => setSeverityFilter(sev === severityFilter ? 'all' : sev)}
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              cursor: 'pointer',
              borderColor: severityFilter === sev ? tokens.status[sev] : tokens.surface.border,
              minWidth: 150,
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tokens.status[sev], flexShrink: 0 }} />
            <Stack spacing={0}>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                {counts[sev]}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                {sev} · open
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Toolbar */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflowX: 'auto', pt: 1, pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        <TextField
          size="small"
          placeholder="Search by device or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { md: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: tokens.text.tertiary }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select label="Sort by" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="severity">Severity</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={severityFilter}
          exclusive
          size="small"
          onChange={(_, val) => val !== null && setSeverityFilter(val)}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="critical">Critical</ToggleButton>
          <ToggleButton value="warning">Warning</ToggleButton>
          <ToggleButton value="info">Info</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Results */}
      {loading ? (
        <Stack spacing={1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No alerts match your filters"
          description="Try adjusting your search term, severity, or status filter to see more alerts."
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Raised</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((alert) => (
                <TableRow key={alert.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {alert.deviceName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" noWrap>
                      {alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <SeverityChip severity={alert.severity} />
                  </TableCell>
                  <TableCell>
                    <AlertStatusChip status={alert.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setViewingAlert(alert)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="More actions">
                        <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, alert })}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, borderTop: `1px solid ${tokens.surface.border}` }}>
            <Typography variant="caption">
              Showing {filtered.length} of {alerts.length} alerts
            </Typography>
          </Stack>
        </Paper>
      )}

      <Menu anchorEl={menuAnchor?.el} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          disabled={menuAnchor?.alert.status !== 'open'}
          onClick={() => {
            if (menuAnchor) acknowledgeAlert(menuAnchor.alert.id);
            setMenuAnchor(null);
          }}
        >
          <CheckCircleOutline fontSize="small" sx={{ mr: 1.25, color: tokens.status.warning }} />
          Acknowledge
        </MenuItem>
        <MenuItem
          disabled={menuAnchor?.alert.status === 'resolved'}
          onClick={() => {
            if (menuAnchor) resolveAlert(menuAnchor.alert.id);
            setMenuAnchor(null);
          }}
        >
          <TaskAltOutlined fontSize="small" sx={{ mr: 1.25, color: tokens.status.online }} />
          Resolve
        </MenuItem>
      </Menu>

      <AlertDetailsDialog
        alert={viewingAlert}
        onClose={() => setViewingAlert(null)}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        canEdit={canEdit}
      />
    </Stack>
  );
}
