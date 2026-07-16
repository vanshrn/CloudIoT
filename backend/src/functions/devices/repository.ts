/**
 * Device repository — Phase 15.2.
 *
 * All DynamoDB reads and writes for the Devices table live here. Handlers
 * import named functions from this module and never touch the DynamoDB SDK
 * directly, which keeps handler files focused on HTTP concerns (parsing,
 * validation, response shaping) and makes DynamoDB logic independently
 * testable by mocking this module in handler tests.
 *
 * Table name is read from the DEVICES_TABLE_NAME environment variable, which
 * CDK injects at deploy time via ApiFunction's `environment` prop.
 *
 * All operations are async and throw on unexpected SDK errors — callers
 * (handlers) wrap calls in try/catch and return a 500 via internalError().
 */
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@shared/dynamo';
import { getEnv } from '@shared/env';
import type { Device, UpdateDeviceInput } from './model';

function tableName(): string {
  return getEnv('DEVICES_TABLE_NAME');
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch a single device by its primary key.
 * Returns `null` when the item does not exist (handler maps this to 404).
 */
export async function getDevice(deviceId: string): Promise<Device | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { deviceId },
    }),
  );
  return (result.Item as Device | undefined) ?? null;
}

/**
 * List devices with optional filtering by status or group.
 *
 * When `status` is supplied the ByStatus-index GSI is queried; when `group`
 * is supplied the ByGroup-index GSI is queried (IDs only, then resolved to
 * full items via BatchGet — skipped for now in favour of a Scan with a filter
 * expression to keep the code simple at this stage).
 *
 * When no filter is supplied the table is scanned with a page limit.
 * NOTE: Scan is acceptable here because the Devices table is expected to hold
 * thousands of devices at most — not millions — and the fleet console always
 * paginates. A more sophisticated access pattern (e.g. segment-parallel Scan)
 * can be introduced if needed.
 */
export interface ListDevicesOptions {
  status?: string;
  group?: string;
  limit?: number;
  /** Opaque continuation token from a previous list response. */
  nextToken?: string;
}

export interface ListDevicesResult {
  items: Device[];
  nextToken?: string;
}

export async function listDevices(options: ListDevicesOptions = {}): Promise<ListDevicesResult> {
  const { status, group, limit = 50, nextToken } = options;

  const exclusiveStartKey = nextToken
    ? (JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) as Record<string, unknown>)
    : undefined;

  if (status) {
    // Query via ByStatus-index
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName(),
        IndexName: 'ByStatus-index',
        KeyConditionExpression: '#st = :status',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':status': status },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false, // most recently seen first
      }),
    );
    return {
      items: (result.Items ?? []) as Device[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }

  if (group) {
    // Query via ByGroup-index
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName(),
        IndexName: 'ByGroup-index',
        KeyConditionExpression: '#grp = :group',
        ExpressionAttributeNames: { '#grp': 'group' },
        ExpressionAttributeValues: { ':group': group },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    // ByGroup-index is KEYS_ONLY — we only have deviceId + group back.
    // Fetch the full items individually. For small group sizes this is fine.
    // TODO: replace with BatchGetItem once group cardinality grows large.
    const keys = (result.Items ?? []) as Array<{ deviceId: string }>;
    const items: Device[] = await Promise.all(keys.map((k) => getDevice(k.deviceId))).then(
      (results) => results.filter((d): d is Device => d !== null),
    );
    return {
      items,
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }

  // Full table Scan (no filter)
  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName(),
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    }),
  );
  return {
    items: (result.Items ?? []) as Device[],
    nextToken: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined,
  };
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Persist a new device item. The caller is responsible for generating deviceId
 * and setting createdAt/updatedAt — the repository does not generate IDs so
 * the handler can include them in the 201 response body deterministically.
 *
 * Uses a condition expression to prevent overwriting an existing device if the
 * same deviceId is submitted twice (idempotency guard).
 */
export async function createDevice(device: Device): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: device,
      ConditionExpression: 'attribute_not_exists(deviceId)',
    }),
  );
}

/**
 * Partially update a device. Builds a dynamic UpdateExpression from the
 * provided fields so only the supplied attributes are overwritten; attributes
 * not present in `input` are left unchanged in DynamoDB.
 *
 * `updatedAt` is always stamped to the current time regardless of what the
 * caller sends.
 *
 * Returns the updated item via ReturnValues=ALL_NEW so the handler can echo
 * it back without a follow-up GetItem call.
 */
export async function updateDevice(
  deviceId: string,
  input: UpdateDeviceInput,
  updatedAt: string,
): Promise<Device | null> {
  const fields: Record<string, unknown> = { ...input, updatedAt };

  const setExpressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    // Protect DynamoDB reserved words by aliasing every field name.
    const nameAlias = `#f_${key}`;
    const valueAlias = `:v_${key}`;
    setExpressions.push(`${nameAlias} = ${valueAlias}`);
    names[nameAlias] = key;
    values[valueAlias] = value;
  }

  if (setExpressions.length === 0) {
    // Nothing to update — return current state.
    return getDevice(deviceId);
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { deviceId },
      ConditionExpression: 'attribute_exists(deviceId)',
      UpdateExpression: `SET ${setExpressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );

  return (result.Attributes as Device | undefined) ?? null;
}

/**
 * Delete a device by primary key.
 * Returns `true` when the item existed and was deleted; `false` when it did
 * not exist (handler maps this to 404).
 */
export async function deleteDevice(deviceId: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName(),
        Key: { deviceId },
        ConditionExpression: 'attribute_exists(deviceId)',
      }),
    );
    return true;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { name?: string }).name === 'ConditionalCheckFailedException'
    ) {
      return false;
    }
    throw err;
  }
}
