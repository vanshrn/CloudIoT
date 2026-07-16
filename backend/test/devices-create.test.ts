/**
 * Unit tests for POST /devices (create handler) — Phase 15.2.
 *
 * The repository module is mocked so tests never touch DynamoDB.
 * The auth middleware is bypassed by mocking aws-jwt-verify.
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
const mockCreateDevice = jest.fn();
jest.mock('../src/functions/devices/repository', () => ({
  createDevice: (...args: unknown[]) => mockCreateDevice(...args),
}));

// ── Env mock ──────────────────────────────────────────────────────────────────
process.env.DEVICES_TABLE_NAME = 'cloudiot-test-devices';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/devices/create');

function makeEvent(body: unknown = {}): APIGatewayProxyEvent {
  return {
    path: '/devices',
    httpMethod: 'POST',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/devices',
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-req' } as Context;
}

const VALID_USER = { sub: 'u-1', username: 'tester', token_use: 'access' };

describe('POST /devices handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(VALID_USER);
  });

  it('returns 401 when no Authorization header is present', async () => {
    const event = makeEvent({ name: 'Sensor', deviceType: 'sensor', group: 'g1', location: 'London' });
    event.headers = {};
    const result = await handler(event, makeContext());
    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const result = await handler(makeEvent({ name: 'Sensor' }), makeContext());
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Validation failed');
  });

  it('returns 400 for non-JSON body', async () => {
    const event = makeEvent();
    event.body = 'not-json';
    const result = await handler(event, makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 201 with the created device on success', async () => {
    mockCreateDevice.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ name: 'Sensor A', deviceType: 'sensor', group: 'factory-1', location: 'Bay 3' }),
      makeContext(),
    );

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.name).toBe('Sensor A');
    expect(body.deviceType).toBe('sensor');
    expect(body.group).toBe('factory-1');
    expect(typeof body.deviceId).toBe('string');
    expect(body.status).toBe('offline');
    expect(mockCreateDevice).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when DynamoDB throws an unexpected error', async () => {
    mockCreateDevice.mockRejectedValue(new Error('DynamoDB unreachable'));

    const result = await handler(
      makeEvent({ name: 'Sensor B', deviceType: 'sensor', group: 'g1', location: 'Rack 4' }),
      makeContext(),
    );

    expect(result.statusCode).toBe(500);
  });
});
