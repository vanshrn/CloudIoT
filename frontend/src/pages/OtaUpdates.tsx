import { useMemo, useState } from 'react';
import { Stack, Box, Typography, Button, Tabs, Tab, Skeleton } from '@mui/material';
import { CloudUploadOutlined, RocketLaunchOutlined, SystemUpdateAltOutlined, CheckCircleOutlined, PendingActionsOutlined } from '@mui/icons-material';
import { useOta } from '@/hooks/useOta';
import { useDevices } from '@/hooks/useDevices';
import { useAuth } from '@/auth/AuthContext';
import StatCard from '@/components/StatCard';
import FirmwareCard from '@/components/ota/FirmwareCard';
import UploadFirmwareDialog from '@/components/ota/UploadFirmwareDialog';
import DeploymentDialog from '@/components/ota/DeploymentDialog';
import DeploymentProgressCard from '@/components/ota/DeploymentProgressCard';
import DeploymentHistoryTable from '@/components/ota/DeploymentHistoryTable';
import RollbackHistoryTable from '@/components/ota/RollbackHistoryTable';
import RollbackDialog from '@/components/ota/RollbackDialog';
import EmptyState from '@/components/EmptyState';
import type { Firmware, Deployment } from '@/types/ota';
import { tokens } from '@/theme/theme';

type Tab_ = 'history' | 'rollbacks';

export default function OtaUpdates() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isOperator = user?.role === 'Operator';
  const canDeploy = isAdmin || isOperator;

  const { firmwares, deployments, rollbacks, loading: otaLoading, uploadFirmware, createDeployment, rollbackDeployment } = useOta();
  const { devices, loading: devicesLoading } = useDevices();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [presetFirmware, setPresetFirmware] = useState<Firmware | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<Deployment | null>(null);
  const [tab, setTab] = useState<Tab_>('history');
  
  const enrichedFirmwares = useMemo(() => {
    return firmwares.map((fw) => ({
      ...fw,
      installCount: devices.filter((d) => d.firmwareVersion === fw.version).length,
    }));
  }, [firmwares, devices]);

  const activeDeployments = useMemo(
    () => deployments.filter((d) => d.status === 'in_progress' || d.status === 'scheduled'),
    [deployments],
  );
  const historyDeployments = useMemo(
    () => deployments.filter((d) => d.status !== 'in_progress' && d.status !== 'scheduled'),
    [deployments],
  );

  const stats = useMemo(
    () => ({
      firmwareCount: enrichedFirmwares.length,
      inProgress: deployments.filter((d) => d.status === 'in_progress').length,
      scheduled: deployments.filter((d) => d.status === 'scheduled').length,
      completed30d: deployments.filter((d) => d.status === 'completed').length,
    }),
    [enrichedFirmwares, deployments],
  );

  const openDeployDialog = (firmware: Firmware | null) => {
    setPresetFirmware(firmware);
    setDeployOpen(true);
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4">OTA Updates</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage firmware releases and fleet-wide deployments.
          </Typography>
        </Box>
        {canDeploy && (
          <Stack direction="row" spacing={1.25}>
            <Button variant="outlined" startIcon={<CloudUploadOutlined />} onClick={() => setUploadOpen(true)}>
              Upload firmware
            </Button>
            <Button variant="contained" startIcon={<RocketLaunchOutlined />} onClick={() => openDeployDialog(null)}>
              New deployment
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        <StatCard label="Firmware versions" value={stats.firmwareCount} icon={SystemUpdateAltOutlined} />
        <StatCard label="Deployments in progress" value={stats.inProgress} icon={RocketLaunchOutlined} accentColor={tokens.status.warning} />
        <StatCard label="Scheduled" value={stats.scheduled} icon={PendingActionsOutlined} accentColor={tokens.status.info} />
        <StatCard label="Completed deployments" value={stats.completed30d} icon={CheckCircleOutlined} accentColor={tokens.status.online} />
      </Stack>

      {/* Active deployments */}
      {activeDeployments.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="h6">Active & scheduled deployments</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {activeDeployments.map((d) => (
              <DeploymentProgressCard key={d.id} deployment={d} onRollback={canDeploy ? setRollbackTarget : undefined} />
            ))}
          </Box>
        </Stack>
      )}

      {/* Firmware list */}
      <Stack spacing={1.5}>
        <Typography variant="h6">Firmware releases</Typography>
        {otaLoading || devicesLoading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={190} />
            ))}
          </Box>
        ) : enrichedFirmwares.length === 0 ? (
          <EmptyState
            title="No firmware uploaded yet"
            description={canDeploy ? "Upload a firmware image to make it available for deployment." : "Wait for an administrator or operator to upload firmware."}
            actionLabel={canDeploy ? "Upload firmware" : undefined}
            onAction={canDeploy ? () => setUploadOpen(true) : undefined}
          />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
            {enrichedFirmwares.map((f) => (
              <FirmwareCard key={f.id} firmware={f} onDeploy={canDeploy ? openDeployDialog : undefined} />
            ))}
          </Box>
        )}
      </Stack>

      {/* History / Rollbacks */}
      <Stack spacing={1.5}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="history" label="Deployment history" />
          <Tab value="rollbacks" label="Rollback history" />
        </Tabs>
        {tab === 'history' ? (
          <DeploymentHistoryTable deployments={historyDeployments} onRollback={canDeploy ? setRollbackTarget : undefined} />
        ) : (
          <RollbackHistoryTable rollbacks={rollbacks} />
        )}
      </Stack>

      <UploadFirmwareDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={uploadFirmware} />

      <DeploymentDialog
        open={deployOpen}
        firmwares={enrichedFirmwares}
        presetFirmware={presetFirmware}
        onClose={() => setDeployOpen(false)}
        onDeploy={createDeployment}
      />

      <RollbackDialog
        deployment={rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={rollbackDeployment}
      />
    </Stack>
  );
}
