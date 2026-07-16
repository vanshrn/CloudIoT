/**
 * Hello World Lambda — foundation verification only.
 *
 * This is not a real feature endpoint. Its only job is to prove that the
 * API Gateway -> Lambda -> CloudWatch Logs path works end-to-end after
 * `cdk deploy`. Future phases add real handlers under sibling directories
 * in src/functions/ (e.g. devices/, telemetry/, alerts/) following this
 * same shape: a small handler that validates input, calls into shared/
 * utilities, and returns via the http.ts helpers.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok } from '@shared/http';
import { stage } from '@shared/env';
import type { HealthCheckResponse } from '@shared/types';

const logger = new Logger({ service: 'hello-world' });

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const log = logger.withRequestId(context.awsRequestId);
  log.info('Received request', {
    path: event.path,
    method: event.httpMethod,
    sourceIp: event.requestContext?.identity?.sourceIp,
  });

  const body: HealthCheckResponse = {
    status: 'ok',
    service: 'cloudiot-backend',
    stage,
    timestamp: new Date().toISOString(),
  };

  return ok(body);
}
