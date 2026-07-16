/**
 * GET /devices — List Devices — Phase 15.2.
 *
 * Protected: requires a valid Cognito access token.
 *
 * Query parameters (all optional):
 *   status   — filter by device status via ByStatus-index GSI
 *   group    — filter by group via ByGroup-index GSI
 *   limit    — max items per page (default 50, max 200)
 *   nextToken — opaque pagination token from a previous response
 *
 * Response 200:
 *   { items: Device[], nextToken?: string, count: number }
 *
 * Response 400: invalid query parameter value.
 * Response 500: unexpected DynamoDB or runtime error.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, badRequest, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { listDevices } from './repository';

const logger = new Logger({ service: 'devices-list' });

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    log.info('List devices request', { sub: user.sub });

    const qs = event.queryStringParameters ?? {};

    // Parse and validate limit
    let limit = DEFAULT_LIMIT;
    if (qs['limit'] !== undefined) {
      const parsed = parseInt(qs['limit'], 10);
      if (isNaN(parsed) || parsed < 1) {
        return badRequest('limit must be a positive integer');
      }
      limit = Math.min(parsed, MAX_LIMIT);
    }

    const status = qs['status'];
    const group = qs['group'];
    const nextToken = qs['nextToken'];

    // status and group are mutually exclusive for now — supporting both would
    // require a Scan with a filter expression which is less efficient.
    if (status && group) {
      return badRequest('status and group filters cannot be combined');
    }

    let result;
    try {
      result = await listDevices({ status, group, limit, nextToken });
    } catch (err) {
      log.error('Failed to list devices', err);
      return internalError();
    }

    log.info('Devices listed', { count: result.items.length, hasNextPage: !!result.nextToken });

    return ok({
      items: result.items,
      count: result.items.length,
      nextToken: result.nextToken,
    });
  },
);
