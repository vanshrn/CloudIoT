/**
 * DELETE /devices/{deviceId} — Delete Device — Phase 15.2.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Path parameter:
 *   deviceId — the device's primary key.
 *
 * Response 204: device deleted (empty body).
 * Response 404: device not found.
 * Response 500: unexpected DynamoDB or runtime error.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { IoTClient, ListThingPrincipalsCommand, DetachThingPrincipalCommand, DetachPolicyCommand, UpdateCertificateCommand, DeleteCertificateCommand, DeleteThingCommand } from '@aws-sdk/client-iot';
import { Logger } from '@shared/logger';
import { notFound, internalError, badRequest } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';
import type { AuthenticatedUser } from '@shared/types';
import { deleteDevice } from './repository';

const iotClient = new IoTClient({});

const logger = new Logger({ service: 'devices-delete' });

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

    log.info('Delete device request', { sub: user.sub, deviceId });

    let deleted: boolean;
    try {
      deleted = await deleteDevice(deviceId);
    } catch (err) {
      log.error('Failed to delete device', err, { deviceId });
      return internalError();
    }

    if (!deleted) {
      log.info('Device not found for deletion', { deviceId });
      return notFound(`Device '${deviceId}' not found`);
    }

    try {
      const stage = getEnv('STAGE');
      const policyName = `CloudIotDevicePolicy-${stage}`;

      log.info('Cleaning up AWS IoT Core resources', { deviceId });
      
      const principalsRes = await iotClient.send(new ListThingPrincipalsCommand({
        thingName: deviceId
      }));

      const principals = principalsRes.principals || [];
      for (const principal of principals) {
        log.info('Detaching and deleting certificate', { deviceId, principal });
        
        await iotClient.send(new DetachThingPrincipalCommand({
          thingName: deviceId,
          principal
        }));
        
        await iotClient.send(new DetachPolicyCommand({
          policyName,
          target: principal
        }));
        
        const certId = principal.split('/').pop();
        if (certId) {
          await iotClient.send(new UpdateCertificateCommand({
            certificateId: certId,
            newStatus: 'INACTIVE'
          }));
          
          await iotClient.send(new DeleteCertificateCommand({
            certificateId: certId
          }));
        }
      }

      log.info('Deleting IoT Thing', { deviceId });
      await iotClient.send(new DeleteThingCommand({
        thingName: deviceId
      }));
    } catch (err) {
       log.error('Failed to clean up AWS IoT resources', err);
    }

    log.info('Device deleted', { deviceId });

    // 204 No Content — empty body, status code only.
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
      },
      body: '',
    };
  },
  ['Administrator', 'Operator']
);
