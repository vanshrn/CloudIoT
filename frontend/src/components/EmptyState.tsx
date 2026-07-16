import { Stack, Typography, Button, Box } from '@mui/material';
import { SearchOffOutlined } from '@mui/icons-material';
import { tokens } from '@/theme/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{
        py: 8,
        px: 3,
        border: `1px dashed ${tokens.surface.borderStrong}`,
        borderRadius: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: tokens.surface.canvas,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchOffOutlined sx={{ color: tokens.text.tertiary }} />
      </Box>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={360}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
