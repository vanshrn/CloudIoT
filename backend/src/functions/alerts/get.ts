/**
 * GET /alerts/{alertId} — Get Alert — Phase 15.4.
 *
 * Protected: requires a valid Cognito access token.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, notFound, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { getAlert } from './repository';

const logger = new Logger({ service: 'alerts-get' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);

    const alertId = event.pathParameters?.['alertId'];
    if (!alertId) {
      return badRequest('Missing path parameter: alertId');
    }

    log.info('Get alert request', { sub: user.sub, alertId });

    try {
      const alert = await getAlert(alertId);
      if (!alert) {
        return notFound('Alert not found');
      }
      return ok(alert);
    } catch (err) {
      log.error('Failed to get alert', err, { alertId });
      return internalError();
    }
  },
);
