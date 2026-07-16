import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import type { Firmware, Deployment, RollbackEntry } from './model';

export async function listFirmwares(): Promise<Firmware[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: getEnv('FIRMWARES_TABLE_NAME'),
    })
  );
  return (result.Items ?? []) as Firmware[];
}

export async function createFirmware(firmware: Firmware): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: getEnv('FIRMWARES_TABLE_NAME'),
      Item: firmware,
      ConditionExpression: 'attribute_not_exists(id)',
    })
  );
}

export async function listDeployments(): Promise<Deployment[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: getEnv('DEPLOYMENTS_TABLE_NAME'),
    })
  );
  return (result.Items ?? []) as Deployment[];
}

export async function createDeployment(deployment: Deployment): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: getEnv('DEPLOYMENTS_TABLE_NAME'),
      Item: deployment,
      ConditionExpression: 'attribute_not_exists(id)',
    })
  );
}

export async function updateDeployment(
  id: string,
  input: Partial<Deployment>
): Promise<Deployment | null> {
  const setExpressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const nameAlias = `#f_${key}`;
    const valueAlias = `:v_${key}`;
    setExpressions.push(`${nameAlias} = ${valueAlias}`);
    names[nameAlias] = key;
    values[valueAlias] = value;
  }

  if (setExpressions.length === 0) return null;

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: getEnv('DEPLOYMENTS_TABLE_NAME'),
        Key: { id },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: `SET ${setExpressions.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      })
    );
    return (result.Attributes as Deployment | undefined) ?? null;
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') return null;
    throw err;
  }
}

export async function listRollbacks(): Promise<RollbackEntry[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: getEnv('ROLLBACKS_TABLE_NAME'),
    })
  );
  return (result.Items ?? []) as RollbackEntry[];
}

export async function createRollback(rollback: RollbackEntry): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: getEnv('ROLLBACKS_TABLE_NAME'),
      Item: rollback,
      ConditionExpression: 'attribute_not_exists(id)',
    })
  );
}
