import { useState } from 'react';
import { Stack, TextField, Avatar, Button, Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/auth/AuthContext';
import { updateProfile } from '@/auth/cognitoClient';
import SettingsSection from './SettingsSection';
import { tokens } from '@/theme/theme';

export default function ProfileSection() {
  const { user, updateSession } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [title] = useState(user?.role || '');
  
  const localPic = user?.email ? localStorage.getItem(`profile_pic_${user.email}`) : null;
  const [picture, setPicture] = useState(localPic || user?.picture || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  
  const initials = (user?.name || 'User').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      await updateProfile({ name });
      
      // Save large base64 image strings to localStorage as Cognito limits attributes to 2048 chars
      if (picture && picture.startsWith('data:image')) {
        localStorage.setItem(`profile_pic_${user?.email}`, picture);
      } else if (!picture) {
        localStorage.removeItem(`profile_pic_${user?.email}`);
      }

      updateSession({ name, picture });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection title="Profile" description="Your personal information and how it appears across CloudIoT." onSave={handleSave} saved={saved} loading={loading}>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={picture} sx={{ width: 64, height: 64, bgcolor: tokens.accent.main, fontSize: '1.25rem' }}>{!picture && initials}</Avatar>
        <Box>
          <Button variant="outlined" size="small" component="label">
            Upload photo
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                      setPicture(ev.target.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </Button>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Full name" size="small" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Job title" size="small" value={title} disabled fullWidth />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Email" type="email" size="small" value={email} disabled fullWidth />
      </Stack>
    </SettingsSection>
  );
}
