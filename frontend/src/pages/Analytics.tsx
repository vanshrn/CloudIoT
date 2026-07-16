import { Stack, Box, CircularProgress, Alert } from '@mui/material';
import {
  SignalCellularAltOutlined,
  DeviceThermostatOutlined,
  BatteryChargingFullOutlined,
  NotificationsActiveOutlined,
} from '@mui/icons-material';
import StatCard from '@/components/StatCard';
import FirmwareDistributionChart from '@/components/charts/FirmwareDistributionChart';
import AvailabilityTrendChart from '@/components/analytics/AvailabilityTrendChart';
import FleetMetricsTrendChart from '@/components/analytics/FleetMetricsTrendChart';
import DeviceUptimeChart from '@/components/analytics/DeviceUptimeChart';
import OfflineDurationChart from '@/components/analytics/OfflineDurationChart';
import AlertStatisticsChart from '@/components/analytics/AlertStatisticsChart';
import { tokens } from '@/theme/theme';

import { useDevices } from '@/hooks/useDevices';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Analytics() {
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();
  const { data: analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics();

  if (devicesLoading || analyticsLoading) return <CircularProgress />;
  if (devicesError) return <Alert severity="error">{devicesError}</Alert>;
  if (analyticsError) return <Alert severity="error">{analyticsError}</Alert>;
  if (!analytics) return null;

  const currentAvailability = analytics.currentAvailability;
  const latestMetrics = analytics.fleetMetricTrend[analytics.fleetMetricTrend.length - 1] || { avgTemp: 0, avgBattery: 0 };
  const openAlerts30d = analytics.openAlerts30d;

  return (
    <Stack spacing={3}>
      {/* Top stat row */}
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        <StatCard
          label="Fleet availability"
          value={`${currentAvailability}%`}
          icon={SignalCellularAltOutlined}
          accentColor={tokens.status.online}
        />
        <StatCard label="Avg. temperature" value={`${latestMetrics.avgTemp}°C`} icon={DeviceThermostatOutlined} />
        <StatCard
          label="Avg. battery"
          value={`${latestMetrics.avgBattery}%`}
          icon={BatteryChargingFullOutlined}
          accentColor={tokens.status.warning}
        />
        <StatCard
          label="Open alerts"
          value={openAlerts30d}
          icon={NotificationsActiveOutlined}
          accentColor={tokens.status.critical}
        />
      </Stack>

      {/* Trend row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <AvailabilityTrendChart data={analytics.availabilityTrend} />
        <FleetMetricsTrendChart data={analytics.fleetMetricTrend} />
      </Box>

      {/* Fleet composition + alert activity */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <FirmwareDistributionChart devices={devices} />
        <AlertStatisticsChart data={analytics.alertStatsByDay} />
      </Box>

      {/* Uptime / offline rankings */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <DeviceUptimeChart data={analytics.uptimeLeaders} />
        <OfflineDurationChart data={analytics.offlineDurationRanking} />
      </Box>
    </Stack>
  );
}
