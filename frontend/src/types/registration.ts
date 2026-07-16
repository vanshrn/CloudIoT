export type ConnectivityType = 'wifi' | 'ethernet' | 'cellular' | 'lorawan';
export type CertMethod = 'auto' | 'upload';
export type CertValidity = '1y' | '2y' | '5y';

export interface RegistrationFormData {
  // Step 1 — Basic information
  name: string;
  deviceType: string;
  group: string;
  location: string;
  description: string;

  // Step 2 — Device certificates
  certMethod: CertMethod;
  certValidity: CertValidity;
  uploadedCertName: string;
  uploadedKeyName: string;
  keyStoredConfirmed: boolean;

  // Step 3 — Network configuration
  connectivity: ConnectivityType;
  ssid: string;
  wifiPassword: string;
  apn: string;
  useStaticIp: boolean;
  staticIp: string;
  subnetMask: string;
  gateway: string;
  mqttEndpoint: string;
  mqttPort: string;
  useTls: boolean;
}

export const initialRegistrationData: RegistrationFormData = {
  name: '',
  deviceType: '',
  group: '',
  location: '',
  description: '',

  certMethod: 'auto',
  certValidity: '2y',
  uploadedCertName: '',
  uploadedKeyName: '',
  keyStoredConfirmed: false,

  connectivity: 'wifi',
  ssid: '',
  wifiPassword: '',
  apn: '',
  useStaticIp: false,
  staticIp: '',
  subnetMask: '255.255.255.0',
  gateway: '',
  mqttEndpoint: 'mqtt.cloudiot.internal',
  mqttPort: '8883',
  useTls: true,
};
