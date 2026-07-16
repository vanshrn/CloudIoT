import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import BasicInfoStep from './BasicInfoStep';
import CertificatesStep from './CertificatesStep';
import NetworkConfigStep from './NetworkConfigStep';
import ReviewStep from './ReviewStep';
import FinishStep from './FinishStep';
import { initialRegistrationData, type RegistrationFormData } from '@/types/registration';
import type { Device } from '@/types/device';
import { createDevice as apiCreateDevice } from '@/api/devices';

const STEP_LABELS = ['Basic Information', 'Device Certificates', 'Network Configuration', 'Review', 'Finish'];

type Errors = Partial<Record<keyof RegistrationFormData, string>>;

function validateStep(step: number, data: RegistrationFormData): Errors {
  const errors: Errors = {};

  if (step === 0) {
    if (!data.name.trim()) errors.name = 'Device name is required';
    if (!data.deviceType) errors.deviceType = 'Select a device type';
    if (!data.group) errors.group = 'Select a group';
    if (!data.location) errors.location = 'Select a location';
  }

  if (step === 1) {
    if (data.certMethod === 'upload') {
      if (!data.uploadedCertName) errors.uploadedCertName = 'Upload a certificate file';
      else if (!data.uploadedKeyName) errors.uploadedKeyName = 'Upload a private key file';
    }
    if (!data.keyStoredConfirmed) errors.keyStoredConfirmed = 'Please confirm before continuing';
  }

  if (step === 2) {
    if (data.connectivity === 'wifi' && !data.ssid.trim()) errors.ssid = 'SSID is required';
    if (data.connectivity === 'cellular' && !data.apn.trim()) errors.apn = 'APN is required';
    if (data.connectivity === 'ethernet' && data.useStaticIp) {
      if (!data.staticIp.trim()) errors.staticIp = 'Static IP is required';
      if (!data.gateway.trim()) errors.gateway = 'Gateway is required';
    }
    if (!data.mqttEndpoint.trim()) errors.mqttEndpoint = 'Broker endpoint is required';
    if (!data.mqttPort.trim()) errors.mqttPort = 'Port is required';
  }

  return errors;
}


interface DeviceRegistrationWizardProps {
  open: boolean;
  onClose: () => void;
  onRegister: (device: Device) => void;
}

export default function DeviceRegistrationWizard({ open, onClose, onRegister }: DeviceRegistrationWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<RegistrationFormData>(initialRegistrationData);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredDevice, setRegisteredDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setData(initialRegistrationData);
      setErrors({});
      setSubmitting(false);
      setSubmitError(null);
      setRegisteredDevice(null);
    }
  }, [open]);

  const update = <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleNext = () => {
    const stepErrors = validateStep(activeStep, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const handleEditStep = (step: number) => setActiveStep(step);

  const handleRegister = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      let device: Device;
      device = await apiCreateDevice({
        name: data.name.trim(),
        deviceType: data.deviceType,
        group: data.group,
        location: data.location,
        ipAddress:
          data.connectivity === 'ethernet' && data.useStaticIp && data.staticIp
            ? data.staticIp
            : undefined,
      });
      onRegister(device);
      setRegisteredDevice(device);
      setActiveStep(4);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setActiveStep(0);
    setData(initialRegistrationData);
    setErrors({});
    setRegisteredDevice(null);
  };

  const handleDone = () => {
    onClose();
  };

  const isFinishStep = activeStep === 4;

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Register device
        {!submitting && (
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEP_LABELS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 320 }}>
        {activeStep === 0 && <BasicInfoStep data={data} errors={errors} update={update} />}
        {activeStep === 1 && <CertificatesStep data={data} errors={errors} update={update} />}
        {activeStep === 2 && <NetworkConfigStep data={data} errors={errors} update={update} />}
        {activeStep === 3 && <ReviewStep data={data} onEditStep={handleEditStep} />}
        {activeStep === 4 && registeredDevice && (
          <FinishStep
            deviceName={registeredDevice.name}
            deviceId={registeredDevice.id}
            credentials={registeredDevice.credentials}
            onRegisterAnother={handleRegisterAnother}
            onDone={handleDone}
          />
        )}
      </DialogContent>

      {!isFinishStep && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={submitting}>
              Back
            </Button>
          )}
          {activeStep < 3 && (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
          {activeStep === 3 && (
            <>
              <Button
                variant="contained"
                onClick={() => void handleRegister()}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {submitting ? 'Registering…' : 'Register device'}
              </Button>
              {submitError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                  {submitError}
                </Typography>
              )}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
