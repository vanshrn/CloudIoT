/**
 * Shared API Gateway (REST API / Lambda proxy integration) response helpers.
 *
 * Every Lambda behind API Gateway returns the same envelope shape, so
 * response building and CORS headers live in one place instead of being
 * copy-pasted into every handler as the API surface grows in future phases.
 */
import type { APIGatewayProxyResult } from 'aws-lambda';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  // Frontend runs on a different origin during local dev (Vite on :5173);
  // tightened to a specific origin allowlist once a custom domain exists.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};

export function ok<T>(body: T, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return respond(200, body, headers);
}

export function created<T>(body: T, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return respond(201, body, headers);
}

export function noContent(headers: Record<string, string> = {}): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: { ...DEFAULT_HEADERS, ...headers },
    body: '',
  };
}

export function badRequest(message: string, details?: unknown): APIGatewayProxyResult {
  return respond(400, { error: 'BadRequest', message, details });
}

export function notFound(message = 'Resource not found'): APIGatewayProxyResult {
  return respond(404, { error: 'NotFound', message });
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return respond(401, { error: 'Unauthorized', message });
}

export function internalError(message = 'Internal server error'): APIGatewayProxyResult {
  return respond(500, { error: 'InternalServerError', message });
}

function respond(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...DEFAULT_HEADERS, ...headers },
    body: JSON.stringify(body),
  };
}
