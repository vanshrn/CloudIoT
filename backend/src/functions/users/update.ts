import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@shared/logger';
import { badRequest, internalError, ok } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'update-user' });
const cognito = new CognitoIdentityProviderClient({});

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    
    const userId = event.pathParameters?.userId;
    if (!userId) return badRequest('Missing userId');

    if (!event.body) return badRequest('Missing body');
    let input: { name?: string; role?: string };
    try {
      input = JSON.parse(event.body);
    } catch {
      return badRequest('Invalid JSON');
    }

    try {
      const userPoolId = getEnv('COGNITO_USER_POOL_ID');
      
      const attrs = [];
      if (input.name) attrs.push({ Name: 'name', Value: input.name });
      if (input.role) attrs.push({ Name: 'custom:role', Value: input.role });
      
      if (attrs.length > 0) {
        await cognito.send(new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: userId,
          UserAttributes: attrs,
        }));
      }
      
      // We return the input merged into a partial representation. The frontend
      // merges this anyway.
      return ok({
        id: userId,
        ...(input.name && { name: input.name }),
        ...(input.role && { role: input.role }),
      });
    } catch (err: any) {
      log.error('Failed to update user', err);
      return internalError();
    }
  },
  ['Administrator']
);
