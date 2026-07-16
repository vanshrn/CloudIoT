/**
 * Unit tests for PUT /devices/{deviceId} (update handler) — Phase 15.2.
 */
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// ── Auth mock ─────────────────────────────────────────────────────────────────
const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) },
}));
process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
process.env.COGNITO_USER_POOL_CLIENT_ID = 'test-client';

// ── Repository mock ───────────────────────────────────────────────────────────
const mockUpdateDevice = jest.fn();
jest.mock('../src/functions/devices/repository', () => ({
  updateDevice: (...args: unknown[]) => mockUpdateDevice(...args),
}));

process.env.DEVICES_TABLE_NAME = 'cloudiot-test-devices';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/devices/update');

function makeEvent(deviceId: string | null = 'dev-1', body: unknown = {}): APIGatewayProxyEvent {
  return {
    path: `/devices/${deviceId ?? ''}`,
    httpMethod: 'PUT',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: deviceId ? { deviceId } : null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/devices/{deviceId}',
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-req' } as Context;
}

const VALID_USER = { sub: 'u-1', username: 'tester', token_use: 'access' };

const UPDATED_DEVICE = {
  deviceId: 'dev-1',
  name: 'Updated Name',
  status: 'online',
  firmwareVersion: '2.0.0',
  lastSeen: '2024-01-02T00:00:00.000Z',
  location: 'Bay 2',
  deviceType: 'sensor',
  group: 'factory-1',
  ipAddress: '10.0.0.2',
  certificateStatus: 'valid',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

describe('PUT /devices/{deviceId} handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(VALID_USER);
  });

  it('returns 401 without a token', async () => {
    const event = makeEvent('dev-1', { name: 'New Name' });
    event.headers = {};
    const result = await handler(event, makeContext());
    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when deviceId path param is missing', async () => {
    const result = await handler(makeEvent(null, { status: 'online' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const result = await handler(makeEvent('dev-1', { status: 'unknown-status' }), makeContext());
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Validation failed');
  });

  it('returns 400 for a non-numeric batteryPct', async () => {
    const result = await handler(makeEvent('dev-1', { batteryPct: 'high' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 404 when device does not exist', async () => {
    const err = Object.assign(new Error('Condition failed'), {
      name: 'ConditionalCheckFailedException',
    });
    mockUpdateDevice.mockRejectedValue(err);
    const result = await handler(makeEvent('nonexistent', { status: 'online' }), makeContext());
    expect(result.statusCode).toBe(404);
  });

  it('returns 200 with updated device on success', async () => {
    mockUpdateDevice.mockResolvedValue(UPDATED_DEVICE);
    const result = await handler(makeEvent('dev-1', { name: 'Updated Name', status: 'online' }), makeContext());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.name).toBe('Updated Name');
  });

  it('returns 500 when repository throws an unexpected error', async () => {
    mockUpdateDevice.mockRejectedValue(new Error('DynamoDB failure'));
    const result = await handler(makeEvent('dev-1', { status: 'online' }), makeContext());
    expect(result.statusCode).toBe(500);
  });
});
