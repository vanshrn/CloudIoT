/**
 * Unit tests for Alerts handlers — Phase 15.4.
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
const mockGetAlert = jest.fn();
const mockListAlerts = jest.fn();
const mockUpdateAlertStatus = jest.fn();

jest.mock('../src/functions/alerts/repository', () => ({
  getAlert: (...args: unknown[]) => mockGetAlert(...args),
  listAlerts: (...args: unknown[]) => mockListAlerts(...args),
  updateAlertStatus: (...args: unknown[]) => mockUpdateAlertStatus(...args),
}));

process.env.ALERTS_TABLE_NAME = 'cloudiot-test-alerts';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getHandler = require('../src/functions/alerts/get').handler;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const listHandler = require('../src/functions/alerts/list').handler;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const updateHandler = require('../src/functions/alerts/update').handler;

function makeEvent(
  pathParameters: Record<string, string> | null = null,
  qs: Record<string, string> | null = null,
  body: string | null = null
): APIGatewayProxyEvent {
  return {
    path: `/alerts`,
    httpMethod: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
    multiValueHeaders: {},
    queryStringParameters: qs,
    multiValueQueryStringParameters: null,
    pathParameters,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/alerts',
    body,
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-req' } as Context;
}

const VALID_USER = { sub: 'u-1', username: 'tester', token_use: 'access' };

const MOCK_ALERT = {
  alertId: 'alt-1',
  deviceId: 'dev-1',
  severity: 'warning',
  status: 'active',
  message: 'High temp',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('Alerts endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(VALID_USER);
  });

  describe('GET /alerts/{alertId}', () => {
    it('returns 400 when alertId is missing', async () => {
      const result = await getHandler(makeEvent(null), makeContext());
      expect(result.statusCode).toBe(400);
    });

    it('returns 404 when alert is not found', async () => {
      mockGetAlert.mockResolvedValue(null);
      const result = await getHandler(makeEvent({ alertId: 'alt-1' }), makeContext());
      expect(result.statusCode).toBe(404);
    });

    it('returns 200 with the alert on success', async () => {
      mockGetAlert.mockResolvedValue(MOCK_ALERT);
      const result = await getHandler(makeEvent({ alertId: 'alt-1' }), makeContext());
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).alertId).toBe('alt-1');
    });
  });

  describe('GET /alerts', () => {
    it('returns 200 with items on success', async () => {
      mockListAlerts.mockResolvedValue({ items: [MOCK_ALERT], nextToken: undefined });
      const result = await listHandler(makeEvent(null, { severity: 'warning' }), makeContext());
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).count).toBe(1);
    });

    it('returns 400 for invalid severity', async () => {
      const result = await listHandler(makeEvent(null, { severity: 'bad-sev' }), makeContext());
      expect(result.statusCode).toBe(400);
    });
  });

  describe('PUT /alerts/{alertId}', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const result = await updateHandler(makeEvent({ alertId: 'alt-1' }, null, 'invalid'), makeContext());
      expect(result.statusCode).toBe(400);
    });

    it('returns 400 when status is missing', async () => {
      const result = await updateHandler(makeEvent({ alertId: 'alt-1' }, null, '{}'), makeContext());
      expect(result.statusCode).toBe(400);
    });

    it('returns 400 when status is invalid', async () => {
      const result = await updateHandler(makeEvent({ alertId: 'alt-1' }, null, JSON.stringify({ status: 'done' })), makeContext());
      expect(result.statusCode).toBe(400);
    });

    it('returns 200 on success', async () => {
      mockUpdateAlertStatus.mockResolvedValue({ ...MOCK_ALERT, status: 'resolved' });
      const result = await updateHandler(makeEvent({ alertId: 'alt-1' }, null, JSON.stringify({ status: 'resolved' })), makeContext());
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).status).toBe('resolved');
    });

    it('returns 404 when alert does not exist', async () => {
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockUpdateAlertStatus.mockRejectedValue(error);
      const result = await updateHandler(makeEvent({ alertId: 'alt-1' }, null, JSON.stringify({ status: 'resolved' })), makeContext());
      expect(result.statusCode).toBe(404);
    });
  });
});
