import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { badRequest, internalError, created } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { createRollback } from './repository';
import type { RollbackEntry } from './model';

const logger = new Logger({ service: 'ota-create-rollback' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    if (!event.body) return badRequest('Missing body');
    let input: RollbackEntry;
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }
    
    input.id = `rb-${Date.now().toString().slice(-6)}`;
    input.performedAt = new Date().toISOString();
    input.performedBy = user.username ?? 'Admin';

    try {
      await createRollback(input);
      // Here we would ideally cancel the active AWS IoT job as well.
      return created(input);
    } catch (err) {
      log.error('Failed to create rollback', err);
      return internalError();
    }
  },
  ['Administrator', 'Operator']
);
