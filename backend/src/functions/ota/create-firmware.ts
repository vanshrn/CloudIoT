import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { badRequest, internalError, created } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { createFirmware } from './repository';
import type { Firmware } from './model';

const logger = new Logger({ service: 'ota-create-firmware' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    if (!event.body) return badRequest('Missing body');
    let input: Firmware;
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }
    
    // Minimal validation could be added here
    input.id = `fw-${Date.now().toString().slice(-6)}`;
    input.installCount = 0;
    input.releasedAt = new Date().toISOString();

    try {
      await createFirmware(input);
      return created(input);
    } catch (err) {
      log.error('Failed to create firmware', err);
      return internalError();
    }
  }
);
