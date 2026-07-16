/**
 * Unit tests for DELETE /devices/{deviceId} (delete handler) — Phase 15.2.
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
const mockDeleteDevice = jest.fn();
jest.mock('../src/functions/devices/repository', () => ({
  deleteDevice: (...args: unknown[]) => mockDeleteDevice(...args),
}));

process.env.DEVICES_TABLE_NAME = 'cloudiot-test-devices';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/devices/delete');

function makeEvent(deviceId: string | null = 'dev-1'): APIGatewayProxyEvent {
  return {
    path: `/devices/${deviceId ?? ''}`,
    httpMethod: 'DELETE',
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

describe('DELETE /devices/{deviceId} handler', () => {
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
    mockDeleteDevice.mockResolvedValue(false);
    const result = await handler(makeEvent('nonexistent'), makeContext());
    expect(result.statusCode).toBe(404);
  });

  it('returns 204 with empty body when deleted successfully', async () => {
    mockDeleteDevice.mockResolvedValue(true);
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(204);
    expect(result.body).toBe('');
  });

  it('returns 500 when the repository throws', async () => {
    mockDeleteDevice.mockRejectedValue(new Error('DynamoDB error'));
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(500);
  });
});
