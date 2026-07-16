/**
 * Lambda authentication middleware — Phase 14.3.
 *
 * Wraps an API Gateway Lambda handler so that, before the handler's own
 * logic runs:
 *
 *   1. An `Authorization: Bearer <token>` header is required.
 *   2. The token is verified against the Cognito User Pool JWKS
 *      (see shared/auth.ts).
 *   3. The wrapped handler is invoked with the authenticated user as a
 *      third argument — it never has to touch headers or tokens itself.
 *
 * Any failure (missing header, expired/invalid/malformed token, wrong
 * pool or client) short-circuits with 401 and the wrapped handler is not
 * called at all.
 *
 * Future protected endpoints reuse this instead of re-implementing token
 * extraction/verification:
 *
 *   export const handler = withAuth(async (event, context, user) => {
 *     return ok({ sub: user.sub });
 *   });
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from './logger';
import { unauthorized } from './http';
import { extractBearerToken, verifyAccessToken, UnauthorizedError } from './auth';
import type { AuthenticatedUser } from './types';

export type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
  user: AuthenticatedUser,
) => Promise<APIGatewayProxyResult>;

const logger = new Logger({ service: 'auth-middleware' });

/**
 * Higher-order function: validates the caller's Cognito ID token
 * before invoking `handler`. Use this to protect any Lambda sitting
 * behind API Gateway rather than duplicating the extract-verify-401 flow
 * per function.
 * 
 * Can optionally enforce Role-Based Access Control (RBAC).
 */
export function withAuth(handler: AuthenticatedHandler, allowedRoles?: string[]) {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    const token = extractBearerToken(event.headers as Record<string, string | undefined>);

    if (!token) {
      log.warn('Request missing bearer token', { path: event.path });
      return unauthorized('Missing bearer token');
    }

    let user: AuthenticatedUser;
    try {
      user = await verifyAccessToken(token);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        log.warn('Token verification failed', { reason: error.message, path: event.path });
      } else {
        log.error('Unexpected error verifying token', error, { path: event.path });
      }
      return unauthorized('Invalid or expired token');
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      log.warn('Forbidden: User does not have required role', { required: allowedRoles, actual: user.role, path: event.path });
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Forbidden', message: 'You do not have permission to perform this action.' }),
      };
    }

    return handler(event, context, user);
  };
}
