/**
 * PUT /devices/{deviceId} — Update Device — Phase 15.2.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Path parameter:
 *   deviceId — the device's primary key.
 *
 * Request body (JSON): any subset of UpdateDeviceInput fields.
 *
 * Response 200: the updated Device item (full record via ReturnValues=ALL_NEW).
 * Response 400: invalid body or field values.
 * Response 404: device not found.
 * Response 500: unexpected DynamoDB or runtime error.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, notFound, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import type { UpdateDeviceInput } from './model';
import { validateUpdateInput } from './model';
import { updateDevice } from './repository';

const logger = new Logger({ service: 'devices-update' });

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

    log.info('Update device request', { sub: user.sub, deviceId });

    // Parse body
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Request body is not valid JSON');
    }

    // Validate
    const errors = validateUpdateInput(body);
    if (errors.length > 0) {
      return badRequest('Validation failed', errors);
    }

    const input = body as UpdateDeviceInput;
    const now = new Date().toISOString();

    let updated;
    try {
      updated = await updateDevice(deviceId, input, now);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        (err as { name?: string }).name === 'ConditionalCheckFailedException'
      ) {
        // Condition expression (attribute_exists) failed — device doesn't exist.
        log.info('Device not found for update', { deviceId });
        return notFound(`Device '${deviceId}' not found`);
      }
      log.error('Failed to update device', err, { deviceId });
      return internalError();
    }

    if (!updated) {
      return notFound(`Device '${deviceId}' not found`);
    }

    log.info('Device updated', { deviceId });
    return ok(updated);
  },
  ['Administrator', 'Operator']
);
