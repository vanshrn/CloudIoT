import { Stack, Box } from '@mui/material';
import { MemoryOutlined, WifiOutlined, WifiOffOutlined, NotificationsActiveOutlined, SystemUpdateAltOutlined } from '@mui/icons-material';
import StatCard from '@/components/StatCard';
import TemperatureTrendChart from '@/components/charts/TemperatureTrendChart';
import FirmwareDistributionChart from '@/components/charts/FirmwareDistributionChart';
import RecentAlertsWidget from '@/components/RecentAlertsWidget';
import DeviceActivityWidget from '@/components/DeviceActivityWidget';
import FleetHealthWidget from '@/components/FleetHealthWidget';
import DeviceStatusSummary from '@/components/DeviceStatusSummary';
import { useDevices } from '@/hooks/useDevices';
import { useAlerts } from '@/hooks/useAlerts';
import { useOta } from '@/hooks/useOta';
import { useAnalytics } from '@/hooks/useAnalytics';
import { tokens } from '@/theme/theme';
import { CircularProgress, Alert } from '@mui/material';
import { useLiveDashboard } from '@/hooks/useLiveDashboard';

export default function Dashboard() {
  useLiveDashboard();
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();
  const { alerts, loading: alertsLoading } = useAlerts();
  const { deployments, loading: otaLoading } = useOta();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();

  if (devicesLoading || alertsLoading || otaLoading || analyticsLoading) return <CircularProgress />;
  if (devicesError) return <Alert severity="error">{devicesError}</Alert>;

  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved').length;
  const pendingOta = deployments.filter((d) => d.status === 'in_progress').length;

  return (
    <Stack spacing={3}>
      {/* Top stat row */}
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        <StatCard label="Total devices" value={total} icon={MemoryOutlined} />
        <StatCard label="Online" value={online} icon={WifiOutlined} accentColor={tokens.status.online} />
        <StatCard label="Offline" value={offline} icon={WifiOffOutlined} accentColor={tokens.status.offline} />
        <StatCard label="Active alerts" value={activeAlerts} icon={NotificationsActiveOutlined} accentColor={tokens.status.critical} />
        <StatCard label="Pending OTA" value={pendingOta} icon={SystemUpdateAltOutlined} accentColor={tokens.status.warning} />
      </Stack>

      {/* Main widget grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        <TemperatureTrendChart trendData={analyticsData?.fleetMetricTrend} />
        <FleetHealthWidget devices={devices} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <DeviceActivityWidget trendData={analyticsData?.alertStatsByDay} />
        <FirmwareDistributionChart devices={devices} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
        }}
      >
        <RecentAlertsWidget alerts={alerts} />
        <DeviceStatusSummary devices={devices} />
      </Box>
    </Stack>
  );
}
