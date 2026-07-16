import { Paper, Stack, Typography, Divider, Button, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saved?: boolean;
  loading?: boolean;
}

export default function SettingsSection({ title, description, children, onSave, saveLabel = 'Save changes', saved, loading }: SettingsSectionProps) {
  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 3 }}>
        <Stack spacing={2.5}>{children}</Stack>
      </Box>
      {onSave && (
        <>
          <Divider />
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.5} sx={{ px: 3, py: 2 }}>
            {saved && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                Saved
              </Typography>
            )}
            <Button variant="contained" onClick={onSave} disabled={loading}>
              {loading ? 'Saving...' : saveLabel}
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
}
