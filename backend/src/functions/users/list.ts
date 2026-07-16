import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand, type UserType } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@shared/logger';
import { ok, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'list-users' });
const cognito = new CognitoIdentityProviderClient({});

function mapUser(cognitoUser: UserType) {
  const attrs = cognitoUser.Attributes || [];
  const getAttr = (name: string) => attrs.find(a => a.Name === name)?.Value || '';
  
  return {
    id: cognitoUser.Username,
    name: getAttr('name') || getAttr('email'),
    email: getAttr('email'),
    role: getAttr('custom:role') || 'Viewer',
    lastActive: cognitoUser.UserLastModifiedDate?.toISOString() || new Date().toISOString(),
    createdAt: cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
  };
}

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    
    try {
      const userPoolId = getEnv('COGNITO_USER_POOL_ID');
      
      const response = await cognito.send(new ListUsersCommand({
        UserPoolId: userPoolId,
      }));
      
      const users = (response.Users || []).map(mapUser);
      
      return ok({ items: users });
    } catch (err) {
      log.error('Failed to list users', err);
      return internalError();
    }
  }
);
