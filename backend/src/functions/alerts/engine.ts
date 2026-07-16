import { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Logger } from '@shared/logger';
import { createAlert } from './repository';
import type { AlertSeverity } from './model';
import * as crypto from 'crypto';

const logger = new Logger({ service: 'alerts-engine' });

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.info(`Processing ${event.Records.length} stream records`);

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
      continue;
    }

    if (!record.dynamodb?.NewImage) {
      continue;
    }

    const telemetry = unmarshall(record.dynamodb.NewImage as any);
    const deviceId = telemetry.deviceId;
    
    // Evaluate alert rules
    const alertsToCreate: { severity: AlertSeverity; message: string }[] = [];

    if (telemetry.temperatureC > 60) {
      alertsToCreate.push({
        severity: 'critical',
        message: `High temperature detected: ${telemetry.temperatureC}°C`,
      });
    } else if (telemetry.temperatureC > 50) {
      alertsToCreate.push({
        severity: 'warning',
        message: `Elevated temperature: ${telemetry.temperatureC}°C`,
      });
    }

    if (telemetry.batteryPct < 15) {
      alertsToCreate.push({
        severity: 'critical',
        message: `Battery level critically low: ${telemetry.batteryPct}%`,
      });
    } else if (telemetry.batteryPct < 25) {
      alertsToCreate.push({
        severity: 'warning',
        message: `Battery level low: ${telemetry.batteryPct}%`,
      });
    }

    if (telemetry.rssiDbm < -90) {
      alertsToCreate.push({
        severity: 'info',
        message: `Weak signal strength: ${telemetry.rssiDbm} dBm`,
      });
    }

    for (const alertData of alertsToCreate) {
      const alertId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      try {
        await createAlert({
          alertId,
          deviceId,
          severity: alertData.severity,
          message: alertData.message,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        logger.info(`Generated ${alertData.severity} alert ${alertId} for device ${deviceId}`);
      } catch (err) {
        logger.error(`Failed to create alert for device ${deviceId}`, err as Error);
      }
    }
  }
};
