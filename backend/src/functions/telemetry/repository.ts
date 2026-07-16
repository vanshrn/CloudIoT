/**
 * Telemetry repository — Phase 15.3.
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import type { TelemetryItem, ListTelemetryInput } from './model';

function tableName(): string {
  return getEnv('TELEMETRY_TABLE_NAME');
}

export interface ListTelemetryResult {
  items: TelemetryItem[];
  nextToken?: string;
}

/**
 * Fetch telemetry for a given deviceId, optionally filtering by time range.
 */
export async function listTelemetry(
  deviceId: string,
  options: ListTelemetryInput = {}
): Promise<ListTelemetryResult> {
  const { start, end, limit = 100, nextToken, order = 'desc' } = options;

  let keyConditionExpression = 'deviceId = :deviceId';
  const expressionAttributeValues: Record<string, unknown> = {
    ':deviceId': deviceId,
  };

  if (start && end) {
    keyConditionExpression += ' AND #ts BETWEEN :start AND :end';
    expressionAttributeValues[':start'] = start;
    expressionAttributeValues[':end'] = end;
  } else if (start) {
    keyConditionExpression += ' AND #ts >= :start';
    expressionAttributeValues[':start'] = start;
  } else if (end) {
    keyConditionExpression += ' AND #ts <= :end';
    expressionAttributeValues[':end'] = end;
  }

  const exclusiveStartKey = nextToken
    ? (JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) as Record<string, unknown>)
    : undefined;

  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeNames: start || end ? { '#ts': 'timestamp' } : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      ScanIndexForward: order === 'asc',
    })
  );

  return {
    items: (result.Items ?? []) as TelemetryItem[],
    nextToken: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined,
  };
}
