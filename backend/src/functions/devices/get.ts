/**
 * GET /devices/{deviceId} — Get Device — Phase 15.2.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Path parameter:
 *   deviceId — the device's primary key.
 *
 * Response 200: the Device item.
 * Response 404: device not found.
 * Response 500: unexpected DynamoDB or runtime error.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, notFound, badRequest, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { getDevice } from './repository';

const logger = new Logger({ service: 'devices-get' });

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

    log.info('Get device request', { sub: user.sub, deviceId });

    let device;
    try {
      device = await getDevice(deviceId);
    } catch (err) {
      log.error('Failed to get device', err, { deviceId });
      return internalError();
    }

    if (!device) {
      log.info('Device not found', { deviceId });
      return notFound(`Device '${deviceId}' not found`);
    }

    return ok(device);
  },
);
