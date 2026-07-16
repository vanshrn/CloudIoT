/**
 * Device Presence Handler.
 * Triggered by AWS IoT Core Lifecycle Events on '$aws/events/presence/+/+'
 */
import { Logger } from '@shared/logger';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ service: 'device-presence' });

export interface PresenceEvent {
  clientId: string;
  eventType: 'connected' | 'disconnected';
  timestamp: number;
}

export const handler = async (event: PresenceEvent): Promise<void> => {
  const { clientId, eventType } = event;
  
  if (!clientId || !eventType) {
    return;
  }

  const status = eventType === 'connected' ? 'online' : 'offline';
  const devicesTable = getEnv('DEVICES_TABLE_NAME');

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: devicesTable,
        Key: { deviceId: clientId },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString()
        }
      })
    );
    logger.info('Device presence updated', { deviceId: clientId, status });
  } catch (error) {
    logger.error('Failed to update presence', error, { deviceId: clientId });
    // Don't throw, we don't want DLQ retries just for presence
  }
};
