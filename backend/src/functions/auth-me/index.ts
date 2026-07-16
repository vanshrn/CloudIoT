/**
 * GET /auth/me — Phase 14.3.
 *
 * First protected endpoint: proves the JWT validation layer works
 * end-to-end (API Gateway -> Lambda -> withAuth -> Cognito JWKS) by
 * returning the caller's own identity straight from their validated
 * access token. No user management and no persistence here — this is
 * strictly "who does this token belong to", not a user profile lookup.
 *
 * Any future protected endpoint follows this same shape: wrap the handler
 * body in `withAuth(...)` from shared/middleware.ts instead of
 * re-implementing token parsing/verification.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';

const logger = new Logger({ service: 'auth-me' });

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    log.info('Authenticated request', { sub: user.sub, path: event.path });

    return ok({
      sub: user.sub,
      username: user.username,
    });
  },
);
