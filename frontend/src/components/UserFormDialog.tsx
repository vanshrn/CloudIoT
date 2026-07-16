import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { AppUser, UserRole } from '@/types/user';
import type { UserFormInput } from '@/hooks/useUsers';

interface UserFormDialogProps {
  open: boolean;
  editingUser: AppUser | null;
  onClose: () => void;
  onSubmit: (input: UserFormInput) => Promise<void | AppUser>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormDialog({ open, editingUser, onClose, onSubmit }: UserFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Viewer');
  const [errors, setErrors] = useState<{ name?: string; email?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editingUser?.name ?? '');
      setEmail(editingUser?.email ?? '');
      setRole(editingUser?.role ?? 'Viewer');
      setErrors({});
    }
  }, [open, editingUser]);

  const handleSubmit = async () => {
    const nextErrors: { name?: string; email?: string; submit?: string } = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) nextErrors.email = 'Enter a valid email address';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), role });
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        {editingUser ? 'Edit user' : 'Add user'}
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField
            label="Full name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="name@company.com"
            fullWidth
          />
          <TextField select label="Role" size="small" value={role} onChange={(e) => setRole(e.target.value as UserRole)} fullWidth>
            <MenuItem value="Administrator">Administrator</MenuItem>
            <MenuItem value="Operator">Operator</MenuItem>
            <MenuItem value="Viewer">Viewer</MenuItem>
          </TextField>
        </Stack>
        {errors.submit && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {errors.submit}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {editingUser ? 'Save changes' : 'Add user'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
