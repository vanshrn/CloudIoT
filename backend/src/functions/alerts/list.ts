/**
 * GET /alerts — List Alerts — Phase 15.4.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Query parameters (all optional):
 *   deviceId — filter by device ID
 *   severity — filter by severity (info, warning, critical)
 *   limit    — max items per page (default 50, max 100)
 *   nextToken— opaque pagination token
 *
 * Response 200:
 *   { items: AlertItem[], nextToken?: string, count: number }
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { listAlerts } from './repository';
import { validateListInput, type ListAlertsInput, type AlertSeverity } from './model';

const logger = new Logger({ service: 'alerts-list' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    log.info('List alerts request', { sub: user.sub });

    const qs = event.queryStringParameters ?? {};

    const errors = validateListInput(qs);
    if (errors.length > 0) {
      return badRequest('Validation failed', errors);
    }

    const options: ListAlertsInput = {
      deviceId: qs['deviceId'],
      severity: qs['severity'] as AlertSeverity | undefined,
      limit: qs['limit'] ? parseInt(qs['limit'], 10) : undefined,
      nextToken: qs['nextToken'],
    };

    try {
      const result = await listAlerts(options);
      log.info('Alerts listed', { count: result.items.length, hasNextPage: !!result.nextToken });

      return ok({
        items: result.items,
        count: result.items.length,
        nextToken: result.nextToken,
      });
    } catch (err) {
      log.error('Failed to list alerts', err);
      return internalError();
    }
  },
);
