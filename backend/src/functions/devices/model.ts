/**
 * Device domain model and input validation — Phase 15.2.
 *
 * Defines the canonical Device shape stored in DynamoDB and the subset of
 * fields that callers supply on create/update. Validation helpers return
 * typed errors rather than throwing so handlers can return a 400 directly
 * without try/catch noise.
 *
 * Deliberately no external validation library — a small set of hand-rolled
 * checks is more readable and has zero cold-start cost. If the number of
 * validated fields grows significantly in a later phase, a lightweight
 * library (e.g. zod) can be introduced then.
 */

/** Status values mirror the frontend `DeviceStatus` type in src/types/device.ts. */
export type DeviceStatus = 'online' | 'offline' | 'warning';

/** Certificate validity state. */
export type CertificateStatus = 'valid' | 'expiring' | 'expired';

/**
 * The full Device record as it is stored in and returned from DynamoDB.
 * All fields are optional except the identity fields (deviceId, name) so that
 * partial updates and future schema additions don't require a migration.
 *
 * Telemetry readings (temperatureC, humidityPct, …) are updated by the
 * telemetry ingest Lambda in a future phase; they are writable here so the
 * Create endpoint can seed initial values if the caller provides them.
 */
export interface Device {
  /** Primary key — stable unique identifier, set once at creation. */
  deviceId: string;
  /** Human-readable name, mutable. */
  name: string;
  /** Connectivity status. */
  status: DeviceStatus;
  /** Firmware version string, e.g. "1.4.2". */
  firmwareVersion: string;
  /** Last heartbeat ISO-8601 timestamp. */
  lastSeen: string;
  /** Physical or logical location label. */
  location: string;
  /** Device type label (e.g. "sensor", "gateway"). */
  deviceType: string;
  /** Logical group name — used by ByGroup-index GSI. */
  group: string;
  /** Private IP address string. */
  ipAddress: string;
  /** Certificate validity state. */
  certificateStatus: CertificateStatus;
  /** Battery percentage 0–100. */
  batteryPct?: number;
  /** Ambient temperature reading in Celsius. */
  temperatureC?: number;
  /** Relative humidity percentage 0–100. */
  humidityPct?: number;
  /** Signal strength in dBm. */
  rssiDbm?: number;
  /** Supply voltage in volts. */
  voltage?: number;
  /** CPU utilisation percentage 0–100. */
  cpuUsagePct?: number;
  /** Memory utilisation percentage 0–100. */
  memoryUsagePct?: number;
  /** ISO-8601 creation timestamp — set once, never updated. */
  createdAt: string;
  /** ISO-8601 last-modified timestamp — updated on every write. */
  updatedAt: string;
}

/**
 * Fields the caller must provide when registering a new device.
 * `deviceId` is generated server-side so it is excluded.
 */
export interface CreateDeviceInput {
  name: string;
  deviceType: string;
  group: string;
  location: string;
  firmwareVersion?: string;
  ipAddress?: string;
}

/**
 * Fields the caller may update. Identity fields (deviceId, createdAt) and
 * server-managed timestamps (updatedAt) are excluded.
 */
export interface UpdateDeviceInput {
  name?: string;
  status?: DeviceStatus;
  firmwareVersion?: string;
  location?: string;
  deviceType?: string;
  group?: string;
  ipAddress?: string;
  certificateStatus?: CertificateStatus;
  batteryPct?: number;
  temperatureC?: number;
  humidityPct?: number;
  rssiDbm?: number;
  voltage?: number;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_STATUSES: DeviceStatus[] = ['online', 'offline', 'warning'];
const VALID_CERT_STATUSES: CertificateStatus[] = ['valid', 'expiring', 'expired'];

export interface ValidationError {
  field: string;
  message: string;
}

/** Validates a CreateDeviceInput. Returns a list of errors (empty = valid). */
export function validateCreateInput(input: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof input !== 'object' || input === null) {
    return [{ field: 'body', message: 'Request body must be a JSON object' }];
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj['name'] !== 'string' || obj['name'].trim() === '') {
    errors.push({ field: 'name', message: 'name is required and must be a non-empty string' });
  }

  if (typeof obj['deviceType'] !== 'string' || obj['deviceType'].trim() === '') {
    errors.push({
      field: 'deviceType',
      message: 'deviceType is required and must be a non-empty string',
    });
  }

  if (typeof obj['group'] !== 'string' || obj['group'].trim() === '') {
    errors.push({ field: 'group', message: 'group is required and must be a non-empty string' });
  }

  if (typeof obj['location'] !== 'string' || obj['location'].trim() === '') {
    errors.push({
      field: 'location',
      message: 'location is required and must be a non-empty string',
    });
  }

  return errors;
}

/** Validates an UpdateDeviceInput. Returns a list of errors (empty = valid). */
export function validateUpdateInput(input: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof input !== 'object' || input === null) {
    return [{ field: 'body', message: 'Request body must be a JSON object' }];
  }

  const obj = input as Record<string, unknown>;

  if ('status' in obj && !VALID_STATUSES.includes(obj['status'] as DeviceStatus)) {
    errors.push({
      field: 'status',
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (
    'certificateStatus' in obj &&
    !VALID_CERT_STATUSES.includes(obj['certificateStatus'] as CertificateStatus)
  ) {
    errors.push({
      field: 'certificateStatus',
      message: `certificateStatus must be one of: ${VALID_CERT_STATUSES.join(', ')}`,
    });
  }

  const numericFields: (keyof UpdateDeviceInput)[] = [
    'batteryPct',
    'temperatureC',
    'humidityPct',
    'rssiDbm',
    'voltage',
    'cpuUsagePct',
    'memoryUsagePct',
  ];
  for (const field of numericFields) {
    if (field in obj && typeof obj[field] !== 'number') {
      errors.push({ field, message: `${field} must be a number` });
    }
  }

  return errors;
}
