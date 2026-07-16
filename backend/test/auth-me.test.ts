import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

/**
 * Mocks aws-jwt-verify so these tests exercise the middleware/handler logic
 * without hitting the real Cognito JWKS endpoint over the network.
 */
const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: () => ({ verify: mockVerify }),
  },
}));

process.env.COGNITO_USER_POOL_ID = 'us-east-1_testPool';
process.env.COGNITO_USER_POOL_CLIENT_ID = 'test-client-id';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../src/functions/auth-me/index');

function makeEvent(headers: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    path: '/auth/me',
    httpMethod: 'GET',
    headers,
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/auth/me',
    body: null,
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-request-id' } as Context;
}

describe('GET /auth/me handler', () => {
  beforeEach(() => {
    mockVerify.mockReset();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const result = await handler(makeEvent(), makeContext());

    expect(result.statusCode).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('returns 401 when the token fails verification', async () => {
    mockVerify.mockRejectedValue(new Error('Token expired'));

    const result = await handler(makeEvent({ Authorization: 'Bearer bad-token' }), makeContext());

    expect(result.statusCode).toBe(401);
    expect(mockVerify).toHaveBeenCalledWith('bad-token');
  });

  it('returns the authenticated user for a valid access token', async () => {
    mockVerify.mockResolvedValue({ sub: 'user-123', username: 'jdoe', token_use: 'access' });

    const result = await handler(makeEvent({ Authorization: 'Bearer good-token' }), makeContext());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.sub).toBe('user-123');
    expect(body.username).toBe('jdoe');
  });
});
