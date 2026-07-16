/**
 * Unit tests for GET /devices/{deviceId}/telemetry (list handler) — Phase 15.3.
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
const mockListTelemetry = jest.fn();
jest.mock('../src/functions/telemetry/repository', () => ({
  listTelemetry: (...args: unknown[]) => mockListTelemetry(...args),
}));

process.env.TELEMETRY_TABLE_NAME = 'cloudiot-test-telemetry';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/telemetry/list');

function makeEvent(deviceId: string | null = 'dev-1', qs: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    path: `/devices/${deviceId ?? ''}/telemetry`,
    httpMethod: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: Object.keys(qs).length ? qs : null,
    multiValueQueryStringParameters: null,
    pathParameters: deviceId ? { deviceId } : null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/devices/{deviceId}/telemetry',
    body: null,
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-req' } as Context;
}

const VALID_USER = { sub: 'u-1', username: 'tester', token_use: 'access' };

const MOCK_TELEMETRY = {
  deviceId: 'dev-1',
  timestamp: '2024-01-01T00:00:00.000Z',
  temperatureC: 22.5,
  humidityPct: 45,
};

describe('GET /devices/{deviceId}/telemetry handler', () => {
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

  it('returns 200 with an items array on success', async () => {
    mockListTelemetry.mockResolvedValue({ items: [MOCK_TELEMETRY], nextToken: undefined });
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.count).toBe(1);
    expect(body.items[0].deviceId).toBe('dev-1');
  });

  it('returns 400 for invalid start time', async () => {
    const result = await handler(makeEvent('dev-1', { start: 'not-a-date' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 for invalid limit', async () => {
    const result = await handler(makeEvent('dev-1', { limit: '-5' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 for invalid order', async () => {
    const result = await handler(makeEvent('dev-1', { order: 'random' }), makeContext());
    expect(result.statusCode).toBe(400);
  });

  it('passes query parameters to repository', async () => {
    mockListTelemetry.mockResolvedValue({ items: [], nextToken: undefined });
    await handler(makeEvent('dev-1', { start: '2024-01-01T00:00:00.000Z', limit: '50', order: 'asc' }), makeContext());
    expect(mockListTelemetry).toHaveBeenCalledWith('dev-1', expect.objectContaining({
      start: '2024-01-01T00:00:00.000Z',
      limit: 50,
      order: 'asc',
    }));
  });

  it('returns 500 when repository throws an unexpected error', async () => {
    mockListTelemetry.mockRejectedValue(new Error('DynamoDB failure'));
    const result = await handler(makeEvent('dev-1'), makeContext());
    expect(result.statusCode).toBe(500);
  });
});
