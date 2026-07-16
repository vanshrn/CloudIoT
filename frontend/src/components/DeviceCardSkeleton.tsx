import { Paper, Stack, Skeleton, Box } from '@mui/material';

export default function DeviceCardSkeleton() {
  return (
    <Paper sx={{ p: 2.25, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={22} />
          <Skeleton variant="text" width="40%" height={16} />
        </Stack>
        <Skeleton variant="rounded" width={64} height={24} />
      </Stack>
      <Skeleton variant="rounded" height={56} />
      <Box>
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="rounded" height={5} sx={{ mt: 0.5 }} />
      </Box>
      <Stack direction="row" justifyContent="space-between">
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="30%" />
      </Stack>
    </Paper>
  );
}
