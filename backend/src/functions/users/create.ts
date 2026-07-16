import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@shared/logger';
import { badRequest, internalError, created } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'create-user' });
const cognito = new CognitoIdentityProviderClient({});

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    if (!event.body) return badRequest('Missing body');
    let input: { name: string; email: string; role: string };
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }
    
    if (!input.email || !input.name) {
      return badRequest('Name and email are required');
    }

    try {
      const userPoolId = getEnv('COGNITO_USER_POOL_ID');
      
      const response = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'name', Value: input.name },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: input.role || 'Viewer' }
        ],
        MessageAction: 'SUPPRESS',
        TemporaryPassword: 'Welcome@123'
      }));
      
      const u = response.User;
      return created({
        id: u?.Username,
        name: input.name,
        email: input.email,
        role: input.role || 'Viewer',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      log.error('Failed to create user', err);
      if (err.name === 'UsernameExistsException') {
        return badRequest('User with this email already exists');
      }
      return internalError();
    }
  },
  ['Administrator']
);
