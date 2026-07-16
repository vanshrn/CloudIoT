/**
 * Telemetry domain model and input validation — Phase 15.3.
 */

export interface TelemetryItem {
  deviceId: string;
  timestamp: string;
  temperatureC?: number;
  humidityPct?: number;
  batteryPct?: number;
  voltage?: number;
  rssiDbm?: number;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
  ttl?: number;
}

export interface ListTelemetryInput {
  start?: string;
  end?: string;
  limit?: number;
  nextToken?: string;
  order?: 'asc' | 'desc';
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Validates query parameters for listTelemetry. Returns a list of errors (empty = valid). */
export function validateListInput(qs: Record<string, string | undefined>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (qs.start && isNaN(Date.parse(qs.start))) {
    errors.push({ field: 'start', message: 'start must be a valid ISO-8601 date string' });
  }

  if (qs.end && isNaN(Date.parse(qs.end))) {
    errors.push({ field: 'end', message: 'end must be a valid ISO-8601 date string' });
  }

  if (qs.limit) {
    const parsed = parseInt(qs.limit, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1000) {
      errors.push({ field: 'limit', message: 'limit must be an integer between 1 and 1000' });
    }
  }

  if (qs.order && !['asc', 'desc'].includes(qs.order)) {
    errors.push({ field: 'order', message: 'order must be asc or desc' });
  }

  return errors;
}
