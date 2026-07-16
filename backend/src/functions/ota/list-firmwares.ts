import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { listFirmwares } from './repository';

const logger = new Logger({ service: 'ota-list-firmwares' });

export const handler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: Context,
    _user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    try {
      const items = await listFirmwares();
      return ok({ items });
    } catch (err) {
      log.error('Failed to list firmwares', err);
      return internalError();
    }
  }
);
