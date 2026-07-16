/**
 * Unit tests for GET /devices (list handler) — Phase 15.2.
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
const mockListDevices = jest.fn();
jest.mock('../src/functions/devices/repository', () => ({
  listDevices: (...args: unknown[]) => mockListDevices(...args),
}));

process.env.DEVICES_TABLE_NAME = 'cloudiot-test-devices';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/devices/list');

function makeEvent(qs: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    path: '/devices',
    httpMethod: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: Object.keys(qs).length ? qs : null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/devices',
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

describe('GET /devices handler', () => {
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

  it('returns 200 with an items array on success', async () => {
    mockListDevices.mockResolvedValue({ items: [MOCK_DEVICE], nextToken: undefined });

    const result = await handler(makeEvent(), makeContext());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.count).toBe(1);
    expect(body.items[0].deviceId).toBe('dev-1');
    expect(body.nextToken).toBeUndefined();
  });

  it('passes status filter through to repository', async () => {
    mockListDevices.mockResolvedValue({ items: [], nextToken: undefined });

    await handler(makeEvent({ status: 'online' }), makeContext());

    expect(mockListDevices).toHaveBeenCalledWith(expect.objectContaining({ status: 'online' }));
  });

  it('returns 400 when both status and group are supplied', async () => {
    const result = await handler(makeEvent({ status: 'online', group: 'g1' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 for a non-integer limit', async () => {
    const result = await handler(makeEvent({ limit: 'abc' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 500 when the repository throws', async () => {
    mockListDevices.mockRejectedValue(new Error('DynamoDB error'));
    const result = await handler(makeEvent(), makeContext());
    expect(result.statusCode).toBe(500);
  });
});
