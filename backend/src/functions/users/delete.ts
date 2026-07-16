import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@shared/logger';
import { badRequest, internalError, noContent } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'delete-user' });
const cognito = new CognitoIdentityProviderClient({});

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    
    const userId = event.pathParameters?.userId;
    if (!userId) return badRequest('Missing userId');

    try {
      const userPoolId = getEnv('COGNITO_USER_POOL_ID');
      
      await cognito.send(new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      }));
      
      return noContent();
    } catch (err: any) {
      log.error('Failed to delete user', err);
      return internalError();
    }
  },
  ['Administrator']
);
