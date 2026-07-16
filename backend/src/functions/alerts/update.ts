/**
 * PUT /alerts/{alertId} — Update Alert — Phase 15.4.
 *
 * Protected: requires a valid Cognito access token.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, notFound, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { updateAlertStatus } from './repository';
import { validateUpdateInput } from './model';

const logger = new Logger({ service: 'alerts-update' });

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

    log.info('Update alert request', { sub: user.sub, alertId });

    let body: any;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const errors = validateUpdateInput(body);
    if (errors.length > 0) {
      return badRequest('Validation failed', errors);
    }

    try {
      const updated = await updateAlertStatus(alertId, { status: body.status });
      return ok(updated);
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        return notFound('Alert not found');
      }
      log.error('Failed to update alert', err, { alertId });
      return internalError();
    }
  },
  ['Administrator', 'Operator']
);
