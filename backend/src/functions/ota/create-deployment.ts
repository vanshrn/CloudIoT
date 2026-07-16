import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { IoTClient, CreateJobCommand } from '@aws-sdk/client-iot';
import { Logger } from '@shared/logger';
import { ok, badRequest, internalError, created } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { createDeployment } from './repository';
import type { Deployment } from './model';

const logger = new Logger({ service: 'ota-create-deployment' });
const iotClient = new IoTClient({});

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    _user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    if (!event.body) return badRequest('Missing body');
    let input: Deployment & { targetDeviceIds?: string[] };
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }
    
    const targetDeviceIds = input.targetDeviceIds ?? [];
    delete input.targetDeviceIds; // Remove before saving to DB
    
    input.id = `dep-${Date.now().toString().slice(-6)}`;
    input.createdAt = new Date().toISOString();
    input.status = input.mode === 'immediate' ? 'in_progress' : 'scheduled';
    if (input.mode === 'immediate') input.startedAt = input.createdAt;
    input.progressPct = 0;
    input.successCount = 0;
    input.failureCount = 0;

    // Trigger AWS IoT Job
    try {
      await createDeployment(input);

      if (targetDeviceIds.length > 0) {
        const [, , , region, accountId] = context.invokedFunctionArn.split(':');
        const targets = targetDeviceIds.map(id => `arn:aws:iot:${region}:${accountId}:thing/${id}`);
        
        await iotClient.send(new CreateJobCommand({
          jobId: input.id,
          targets,
          document: JSON.stringify({
            operation: 'firmwareUpdate',
            version: input.firmwareVersion,
            firmwareId: input.firmwareId
          }),
          targetSelection: 'SNAPSHOT',
        }));
      }

      return created(input);
    } catch (err) {
      log.error('Failed to create deployment or IoT Job', err);
      return internalError();
    }
  },
  ['Administrator', 'Operator']
);
