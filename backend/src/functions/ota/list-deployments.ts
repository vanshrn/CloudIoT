import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { listDeployments, updateDeployment } from './repository';
import { IoTClient, DescribeJobCommand } from '@aws-sdk/client-iot';

const iot = new IoTClient({});

const logger = new Logger({ service: 'ota-list-deployments' });

export const handler = withAuth(
  async (
    __event: APIGatewayProxyEvent,
    context: Context,
    __user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    try {
      const items = await listDeployments();
      
      const updatedItems = await Promise.all(items.map(async (d) => {
        if (d.status === 'in_progress') {
          try {
            const { job } = await iot.send(new DescribeJobCommand({ jobId: d.id }));
            if (job && job.jobProcessDetails) {
              const details = job.jobProcessDetails;
              const succeeded = details.numberOfSucceededThings || 0;
              const failed = (details.numberOfFailedThings || 0) + (details.numberOfRejectedThings || 0) + (details.numberOfCanceledThings || 0) + (details.numberOfTimedOutThings || 0);
              
              const processed = succeeded + failed;
              const progressPct = d.deviceCount > 0 ? Math.round((processed / d.deviceCount) * 100) : 100;
              
              let newStatus: string = d.status;
              let completedAt = d.completedAt;
              if (processed >= d.deviceCount && d.deviceCount > 0) {
                newStatus = 'completed';
                completedAt = new Date().toISOString();
              } else if (job.status === 'COMPLETED' || job.status === 'CANCELED') {
                newStatus = 'completed';
                completedAt = new Date().toISOString();
              }
              
              if (progressPct !== d.progressPct || newStatus !== d.status) {
                const patch: any = { progressPct, status: newStatus, successCount: succeeded };
                if (completedAt) patch.completedAt = completedAt;
                
                await updateDeployment(d.id, patch);
                return { ...d, ...patch };
              }
            }
          } catch (err) {
            log.error(`Failed to describe job ${d.id}`, err);
          }
        }
        return d;
      }));

      return ok({ items: updatedItems });
    } catch (err) {
      log.error('Failed to list deployments', err);
      return internalError();
    }
  }
);
