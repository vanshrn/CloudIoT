import { useState } from 'react';
import { Stack, TextField, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SettingsSection from './SettingsSection';
import { updatePassword } from '@/auth/cognitoClient';

export default function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updatePassword(currentPassword, newPassword);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <SettingsSection 
        title="Password" 
        description="Update your password." 
        onSave={handleSave} 
        saved={saved} 
        saveLabel="Update password"
        loading={loading}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <TextField 
          label="Current password" 
          type={showPassword ? 'text' : 'password'} 
          size="small" 
          value={currentPassword} 
          onChange={(e) => setCurrentPassword(e.target.value)} 
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField 
          label="New password" 
          type={showPassword ? 'text' : 'password'} 
          size="small" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField 
          label="Confirm new password" 
          type={showPassword ? 'text' : 'password'} 
          size="small" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </SettingsSection>
    </Stack>
  );
}
