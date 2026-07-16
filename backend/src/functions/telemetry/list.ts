/**
 * GET /devices/{deviceId}/telemetry — List Telemetry — Phase 15.3.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Path parameter:
 *   deviceId — the device's primary key.
 *
 * Query parameters (all optional):
 *   start    — ISO-8601 start time
 *   end      — ISO-8601 end time
 *   limit    — max items per page (default 100, max 1000)
 *   nextToken— opaque pagination token
 *   order    — 'asc' or 'desc' (default 'desc')
 *
 * Response 200:
 *   { items: TelemetryItem[], nextToken?: string, count: number }
 *
 * Response 400: invalid query parameter value.
 * Response 500: unexpected DynamoDB or runtime error.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { listTelemetry } from './repository';
import { validateListInput, type ListTelemetryInput } from './model';

const logger = new Logger({ service: 'telemetry-list' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);

    const deviceId = event.pathParameters?.['deviceId'];
    if (!deviceId) {
      return badRequest('Missing path parameter: deviceId');
    }

    log.info('List telemetry request', { sub: user.sub, deviceId });

    const qs = event.queryStringParameters ?? {};

    const errors = validateListInput(qs);
    if (errors.length > 0) {
      return badRequest('Validation failed', errors);
    }

    const options: ListTelemetryInput = {
      start: qs['start'],
      end: qs['end'],
      limit: qs['limit'] ? parseInt(qs['limit'], 10) : undefined,
      nextToken: qs['nextToken'],
      order: qs['order'] as 'asc' | 'desc' | undefined,
    };

    try {
      const result = await listTelemetry(deviceId, options);
      log.info('Telemetry listed', { count: result.items.length, hasNextPage: !!result.nextToken });

      return ok({
        items: result.items,
        count: result.items.length,
        nextToken: result.nextToken,
      });
    } catch (err) {
      log.error('Failed to list telemetry', err, { deviceId });
      return internalError();
    }
  },
);
