import { handler } from '../src/functions/hello-world/index';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

function makeEvent(): APIGatewayProxyEvent {
  return {
    path: '/hello',
    httpMethod: 'GET',
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '/hello',
    body: null,
    isBase64Encoded: false,
  };
}

function makeContext(): Context {
  return { awsRequestId: 'test-request-id' } as Context;
}

describe('hello-world handler', () => {
  it('returns a 200 with an ok status payload', async () => {
    const result = await handler(makeEvent(), makeContext());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('cloudiot-backend');
    expect(typeof body.timestamp).toBe('string');
  });
});
