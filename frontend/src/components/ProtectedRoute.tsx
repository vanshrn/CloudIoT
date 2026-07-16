import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { tokens } from '@/theme/theme';

/**
 * Route guard — Phase 14.2. Renders its nested routes only once a Cognito
 * session has been confirmed (either restored on refresh or just signed
 * in). Unauthenticated visitors are redirected to /login, with the
 * originally requested location preserved so Login can send them back.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: tokens.surface.canvas,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
