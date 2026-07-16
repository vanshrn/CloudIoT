/**
 * Telemetry Ingest Handler — Phase 17.
 * Triggered by AWS IoT Core rule on 'telemetry/+'
 */
import { Logger } from '@shared/logger';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ service: 'telemetry-ingest' });

export interface IngestEvent {
  payload: Record<string, unknown>;
  deviceId: string;
  ts: number; // Unix timestamp in ms from IoT Core
}

const RETENTION_DAYS = 90;

export const handler = async (event: IngestEvent): Promise<void> => {
  if (!event.deviceId || !event.ts || !event.payload) {
    logger.warn('Invalid event payload structure', { event });
    return; // Drop invalid messages so they don't dead-letter loop
  }

  const { deviceId, ts, payload } = event;

  // Validate telemetry fields — they should be numbers if present
  const temperatureC = typeof payload.temperatureC === 'number' ? payload.temperatureC : undefined;
  const humidityPct = typeof payload.humidityPct === 'number' ? payload.humidityPct : undefined;
  const batteryPct = typeof payload.batteryPct === 'number' ? payload.batteryPct : undefined;
  const voltage = typeof payload.voltage === 'number' ? payload.voltage : undefined;
  const rssiDbm = typeof payload.rssiDbm === 'number' ? payload.rssiDbm : undefined;
  const firmwareVersion = typeof payload.firmwareVersion === 'string' ? payload.firmwareVersion : undefined;

  const timestamp = new Date(ts).toISOString();
  
  // Calculate TTL in epoch seconds
  const ttl = Math.floor(Date.now() / 1000) + (RETENTION_DAYS * 24 * 60 * 60);

  const telemetryTable = getEnv('TELEMETRY_TABLE_NAME');
  const devicesTable = getEnv('DEVICES_TABLE_NAME');

  try {
    await docClient.send(
      new PutCommand({
        TableName: telemetryTable,
        Item: {
          deviceId,
          timestamp,
          ttl,
          ...(temperatureC !== undefined && { temperatureC }),
          ...(humidityPct !== undefined && { humidityPct }),
          ...(batteryPct !== undefined && { batteryPct }),
          ...(voltage !== undefined && { voltage }),
          ...(rssiDbm !== undefined && { rssiDbm }),
        },
      })
    );
    
    // Update the device status and latest telemetry
    const updateExprParts: string[] = ['#status = :status', '#lastSeen = :lastSeen', '#updatedAt = :updatedAt'];
    const exprAttrNames: Record<string, string> = {
      '#status': 'status',
      '#lastSeen': 'lastSeen',
      '#updatedAt': 'updatedAt'
    };
    const exprAttrValues: Record<string, unknown> = {
      ':status': 'online',
      ':lastSeen': timestamp,
      ':updatedAt': timestamp
    };

    if (temperatureC !== undefined) { updateExprParts.push('#temperatureC = :temperatureC'); exprAttrNames['#temperatureC'] = 'temperatureC'; exprAttrValues[':temperatureC'] = temperatureC; }
    if (humidityPct !== undefined) { updateExprParts.push('#humidityPct = :humidityPct'); exprAttrNames['#humidityPct'] = 'humidityPct'; exprAttrValues[':humidityPct'] = humidityPct; }
    if (batteryPct !== undefined) { updateExprParts.push('#batteryPct = :batteryPct'); exprAttrNames['#batteryPct'] = 'batteryPct'; exprAttrValues[':batteryPct'] = batteryPct; }
    if (voltage !== undefined) { updateExprParts.push('#voltage = :voltage'); exprAttrNames['#voltage'] = 'voltage'; exprAttrValues[':voltage'] = voltage; }
    if (rssiDbm !== undefined) { updateExprParts.push('#rssiDbm = :rssiDbm'); exprAttrNames['#rssiDbm'] = 'rssiDbm'; exprAttrValues[':rssiDbm'] = rssiDbm; }
    if (firmwareVersion !== undefined) { updateExprParts.push('#firmwareVersion = :firmwareVersion'); exprAttrNames['#firmwareVersion'] = 'firmwareVersion'; exprAttrValues[':firmwareVersion'] = firmwareVersion; }

    await docClient.send(
      new UpdateCommand({
        TableName: devicesTable,
        Key: { deviceId },
        UpdateExpression: `SET ${updateExprParts.join(', ')}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues
      })
    );

    logger.info('Ingested telemetry and updated device status', { deviceId, timestamp });
  } catch (error) {
    logger.error('Failed to process telemetry', error, { deviceId, timestamp });
    throw error; // Throw so IoT Core registers a failure
  }
};
