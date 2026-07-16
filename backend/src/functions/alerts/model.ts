/**
 * Alerts domain model and input validation — Phase 15.4.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertItem {
  alertId: string;
  deviceId: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAlertsInput {
  deviceId?: string;
  severity?: AlertSeverity;
  limit?: number;
  nextToken?: string;
}

export interface UpdateAlertInput {
  status: AlertStatus;
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Validates query parameters for listAlerts. Returns a list of errors (empty = valid). */
export function validateListInput(qs: Record<string, string | undefined>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (qs.severity && !['info', 'warning', 'critical'].includes(qs.severity)) {
    errors.push({ field: 'severity', message: 'severity must be info, warning, or critical' });
  }

  if (qs.limit) {
    const parsed = parseInt(qs.limit, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      errors.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' });
    }
  }

  return errors;
}

/** Validates JSON body for updateAlertStatus. */
export function validateUpdateInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'body must be a JSON object' });
    return errors;
  }

  if (!body.status || !['active', 'acknowledged', 'resolved'].includes(body.status)) {
    errors.push({ field: 'status', message: 'status must be active, acknowledged, or resolved' });
  }

  return errors;
}
