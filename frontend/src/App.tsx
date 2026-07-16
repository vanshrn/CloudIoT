import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import Login from '@/pages/Login';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Devices from '@/pages/Devices';
import DeviceDetails from '@/pages/DeviceDetails';
import Telemetry from '@/pages/Telemetry';
import Alerts from '@/pages/Alerts';
import Analytics from '@/pages/Analytics';
import OtaUpdates from '@/pages/OtaUpdates';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:deviceId" element={<DeviceDetails />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ota-updates" element={<OtaUpdates />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
