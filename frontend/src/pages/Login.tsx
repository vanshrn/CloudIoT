import { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Cloud } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { tokens } from '@/theme/theme';
import { useAuth } from '@/auth/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, newPasswordRequired, completeNewPassword, cancelNewPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await completeNewPassword(newPassword);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to set new password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNewPassword = () => {
    setNewPassword('');
    setConfirmNewPassword('');
    setError(null);
    setPassword('');
    cancelNewPassword();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at 20% 20%, #16203E 0%, ${tokens.sidebar.bg} 55%)`,
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: `1px solid ${tokens.surface.border}`,
        }}
      >
        <Stack spacing={0.5} alignItems="flex-start" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: tokens.accent.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <Cloud sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          {newPasswordRequired ? (
            <>
              <Typography variant="h4">Set a new password</Typography>
              <Typography variant="body2" color="text.secondary">
                Your account was created with a temporary password. Choose a new one to continue.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h4">Sign in to CloudIoT</Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor and manage your device fleet
              </Typography>
            </>
          )}
        </Stack>

        {newPasswordRequired ? (
          <form onSubmit={handleNewPasswordSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="New password"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                helperText="At least 8 characters, with an uppercase letter, a lowercase letter, and a digit."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword((s) => !s)} edge="end" size="small">
                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm new password"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={submitting}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.25 }}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {submitting ? 'Setting password…' : 'Set new password & sign in'}
              </Button>

              <MuiLink
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={handleCancelNewPassword}
                sx={{ alignSelf: 'center' }}
              >
                Back to sign in
              </MuiLink>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={submitting}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel control={<Checkbox size="small" />} label={<Typography variant="body2">Remember me</Typography>} />
                <MuiLink href="#" variant="body2" underline="hover">
                  Forgot password?
                </MuiLink>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.25 }}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
