import { Paper, Stack, Typography, Chip } from '@mui/material';
import { ConstructionOutlined } from '@mui/icons-material';
import { tokens } from '@/theme/theme';

interface PhasePlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

export default function PhasePlaceholder({ title, description, phase }: PhasePlaceholderProps) {
  return (
    <Paper
      sx={{
        p: 6,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 360,
        justifyContent: 'center',
        border: `1px dashed ${tokens.surface.borderStrong}`,
      }}
    >
      <Stack spacing={2} alignItems="center" maxWidth={440}>
        <ConstructionOutlined sx={{ fontSize: 32, color: tokens.text.tertiary }} />
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Chip label={phase} size="small" sx={{ bgcolor: `${tokens.accent.main}18`, color: tokens.accent.main, fontWeight: 600 }} />
      </Stack>
    </Paper>
  );
}
