/**
 * Unit tests for GET /devices/{deviceId} (get handler) — Phase 15.2.
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
const mockGetDevice = jest.fn();
jest.mock('../src/functions/devices/repository', () => ({
  getDevice: (...args: unknown[]) => mockGetDevice(...args),
}));

process.env.DEVICES_TABLE_NAME = 'cloudiot-test-devices';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/devices/get');

function makeEvent(deviceId: string | null = 'dev-1'): APIGatewayProxyEvent {
  return {
    path: `/devices/${deviceId ?? ''}`,
    httpMethod: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: deviceId ? { deviceId } : null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/devices/{deviceId}',
    body: null,
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-req' } as Context;
}

const VALID_USER = { sub: 'u-1', username: 'tester', token_use: 'access' };

const MOCK_DEVICE = {
  deviceId: 'dev-1',
  name: 'Sensor A',
  status: 'online',
  firmwareVersion: '1.0.0',
  lastSeen: '2024-01-01T00:00:00.000Z',
  location: 'Bay 1',
  deviceType: 'sensor',
  group: 'factory-1',
  ipAddress: '10.0.0.1',
  certificateStatus: 'valid',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('GET /devices/{deviceId} handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(VALID_USER);
  });

  it('returns 401 without a token', async () => {
    const event = makeEvent();
    event.headers = {};
    const result = await handler(event, makeContext());
    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when deviceId path param is missing', async () => {
    const result = await handler(makeEvent(null), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 404 when device does not exist', async () => {
    mockGetDevice.mockResolvedValue(null);
    const result = await handler(makeEvent('nonexistent'), makeContext());
    expect(result.statusCode).toBe(404);
  });

  it('returns 200 with the device on success', async () => {
    mockGetDevice.mockResolvedValue(MOCK_DEVICE);
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.deviceId).toBe('dev-1');
    expect(body.name).toBe('Sensor A');
  });

  it('returns 500 when the repository throws', async () => {
    mockGetDevice.mockRejectedValue(new Error('DynamoDB error'));
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(500);
  });
});
