/**
 * POST /devices — Create Device — Phase 15.2.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Request body (JSON):
 *   { name, deviceType, group, location, firmwareVersion?, ipAddress? }
 *
 * Response 201:
 *   The newly created Device item.
 *
 * Response 400: validation failure (missing/invalid fields).
 * Response 409: a device with the generated ID already exists (should never
 *               happen — included for completeness).
 * Response 500: unexpected DynamoDB or runtime error.
 */
import { randomUUID } from 'crypto';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { IoTClient, CreateThingCommand, CreateKeysAndCertificateCommand, AttachPolicyCommand, AttachThingPrincipalCommand } from '@aws-sdk/client-iot';
import { Logger } from '@shared/logger';
import { created, badRequest, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';
import type { AuthenticatedUser } from '@shared/types';
import { validateCreateInput } from './model';
import type { Device } from './model';
import { createDevice } from './repository';

const logger = new Logger({ service: 'devices-create' });
const iotClient = new IoTClient({});

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    log.info('Create device request', { sub: user.sub });

    // Parse body
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Request body is not valid JSON');
    }

    // Validate
    const errors = validateCreateInput(body);
    if (errors.length > 0) {
      return badRequest('Validation failed', errors);
    }

    const input = body as { name: string; deviceType: string; group: string; location: string; firmwareVersion?: string; ipAddress?: string };
    const now = new Date().toISOString();

    const device: Device = {
      deviceId: randomUUID(),
      name: input.name.trim(),
      status: 'offline',
      firmwareVersion: input.firmwareVersion ?? 'unknown',
      lastSeen: now,
      location: input.location.trim(),
      deviceType: input.deviceType.trim(),
      group: input.group.trim(),
      ipAddress: input.ipAddress ?? '',
      certificateStatus: 'valid',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await createDevice(device);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        (err as { name?: string }).name === 'ConditionalCheckFailedException'
      ) {
        // UUID collision — astronomically unlikely but handled for correctness.
        log.warn('deviceId collision on create', { deviceId: device.deviceId });
        return internalError('Could not create device — please retry');
      }
      log.error('Failed to create device', err);
      return internalError();
    }

    let certificatePem: string | undefined;
    let privateKey: string | undefined;

    try {
      const stage = getEnv('STAGE');
      const policyName = `CloudIotDevicePolicy-${stage}`;
      const thingTypeName = `CloudIotDevice-${stage}`;

      // Create IoT Thing
      log.info('Provisioning AWS IoT Thing', { deviceId: device.deviceId });
      await iotClient.send(new CreateThingCommand({
        thingName: device.deviceId,
        thingTypeName
      }));

      // Generate Certificate and Keys
      log.info('Generating unique certificate and keys', { deviceId: device.deviceId });
      const certRes = await iotClient.send(new CreateKeysAndCertificateCommand({
        setAsActive: true
      }));

      if (certRes.certificateArn && certRes.certificatePem && certRes.keyPair?.PrivateKey) {
        certificatePem = certRes.certificatePem;
        privateKey = certRes.keyPair.PrivateKey;

        // Attach Policy to Certificate
        log.info('Attaching policy to certificate', { certificateArn: certRes.certificateArn });
        await iotClient.send(new AttachPolicyCommand({
          policyName,
          target: certRes.certificateArn
        }));

        // Attach Certificate to Thing
        log.info('Attaching certificate to Thing', { deviceId: device.deviceId, certificateArn: certRes.certificateArn });
        await iotClient.send(new AttachThingPrincipalCommand({
          thingName: device.deviceId,
          principal: certRes.certificateArn
        }));
      } else {
        log.error('Failed to generate full certificate and keys');
      }
    } catch (err: unknown) {
      log.error('Failed to provision AWS IoT resources', err);
      // We do not fail the overall API request if IoT provisioning fails,
      // but in production this would require a saga or dead-letter queue.
    }

    log.info('Device created', { deviceId: device.deviceId });
    return created({
      ...device,
      credentials: certificatePem && privateKey ? { certificatePem, privateKey } : undefined
    });
  },
  ['Administrator', 'Operator']
);
