/**
 * Alerts repository — Phase 15.4.
 */
import { QueryCommand, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import type { AlertItem, ListAlertsInput, UpdateAlertInput } from './model';

function tableName(): string {
  return getEnv('ALERTS_TABLE_NAME');
}

export interface ListAlertsResult {
  items: AlertItem[];
  nextToken?: string;
}

/** Fetch a single alert by ID. */
export async function getAlert(alertId: string): Promise<AlertItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { alertId },
    })
  );
  return (result.Item as AlertItem) ?? null;
}

/**
 * Fetch alerts, optionally filtering by deviceId or severity.
 * Uses ByDevice-index or BySeverity-index.
 * If no filters are provided, fetches across all severities via parallel queries
 * and merges them in memory to avoid full table scans.
 */
export async function listAlerts(options: ListAlertsInput = {}): Promise<ListAlertsResult> {
  const { deviceId, severity, limit = 50, nextToken } = options;

  let indexName = 'BySeverity-index';
  let partitionKeyName = 'severity';
  let partitionKeyValue: string | string[] = severity ? [severity] : ['critical', 'warning', 'info'];

  if (deviceId) {
    indexName = 'ByDevice-index';
    partitionKeyName = 'deviceId';
    partitionKeyValue = [deviceId];
  }

  if (Array.isArray(partitionKeyValue) && partitionKeyValue.length > 1) {
    // Parallel queries across all severities.
    const promises = partitionKeyValue.map(async (sev) => {
      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName(),
          IndexName: indexName,
          KeyConditionExpression: `${partitionKeyName} = :pk`,
          ExpressionAttributeValues: { ':pk': sev },
          Limit: limit,
          ScanIndexForward: false, // newest first
        })
      );
      return (result.Items ?? []) as AlertItem[];
    });
    
    const results = await Promise.all(promises);
    const allItems = results.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    return { items: allItems, nextToken: undefined };
  } else {
    // Single partition query (specific severity or specific deviceId)
    const pkValue = Array.isArray(partitionKeyValue) ? partitionKeyValue[0] : partitionKeyValue;
    const exclusiveStartKey = nextToken
      ? (JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) as Record<string, unknown>)
      : undefined;

    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName(),
        IndexName: indexName,
        KeyConditionExpression: `${partitionKeyName} = :pk`,
        ExpressionAttributeValues: { ':pk': pkValue },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false, // newest first
      })
    );

    return {
      items: (result.Items ?? []) as AlertItem[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}

/** Update an alert's status (e.g. acknowledge, resolve). */
export async function updateAlertStatus(alertId: string, input: UpdateAlertInput): Promise<AlertItem> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { alertId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ConditionExpression: 'attribute_exists(alertId)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': input.status,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes as AlertItem;
}

/** Create a new alert (used by Alerts Engine). */
export async function createAlert(item: AlertItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: item,
    })
  );
}
