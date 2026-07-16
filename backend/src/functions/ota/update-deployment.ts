import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { IoTClient, CancelJobCommand } from '@aws-sdk/client-iot';
import { Logger } from '@shared/logger';
import { ok, badRequest, internalError, notFound } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { updateDeployment } from './repository';
import type { DeploymentStatus } from './model';

const logger = new Logger({ service: 'ota-update-deployment' });
const iotClient = new IoTClient({});

export interface UpdateDeploymentInput {
  status?: DeploymentStatus;
  progressPct?: number;
  successCount?: number;
  completedAt?: string;
}

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    _user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    const deploymentId = event.pathParameters?.deploymentId;
    if (!deploymentId) return badRequest('Missing deploymentId');
    if (!event.body) return badRequest('Missing body');
    
    let input: UpdateDeploymentInput;
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }

    try {
      if (input.status === 'rolled_back') {
        try {
          await iotClient.send(new CancelJobCommand({ jobId: deploymentId, force: true }));
          log.info(`Cancelled AWS IoT Job ${deploymentId}`);
        } catch (jobErr: any) {
          if (jobErr.name !== 'ResourceNotFoundException') {
            log.error(`Failed to cancel job ${deploymentId}`, jobErr);
          }
        }
      }

      const result = await updateDeployment(deploymentId, input);
      if (!result) return notFound('Deployment not found');
      return ok(result);
    } catch (err) {
      log.error('Failed to update deployment', err);
      return internalError();
    }
  },
  ['Administrator', 'Operator']
);
