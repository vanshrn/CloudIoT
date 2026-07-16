/**
 * Cognito JWT validation — Phase 14.3.
 *
 * Verifies Cognito *access* tokens (not ID tokens) against the deployed
 * User Pool's JWKS using the official `aws-jwt-verify` library, so
 * signature verification, `iss`, `token_use`, `client_id`, and expiry
 * checks all follow AWS's own implementation instead of a hand-rolled
 * JWKS client.
 *
 * The verifier is created once per module load (Lambda cold start) so the
 * JWKS is fetched once and cached in memory across warm invocations rather
 * than being re-fetched on every request.
 *
 * `COGNITO_USER_POOL_ID` / `COGNITO_USER_POOL_CLIENT_ID` are injected by
 * CDK — see lib/constructs/api-function.ts usage in
 * lib/stacks/foundation-stack.ts.
 */
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { getEnv } from './env';
import type { AuthenticatedUser } from './types';

/** Thrown for any failure to verify a token — expired, malformed, wrong pool/client, bad signature, etc. */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

type Verifier = ReturnType<typeof CognitoJwtVerifier.create>;

let cachedVerifier: Verifier | undefined;

function getVerifier(): Verifier {
  if (!cachedVerifier) {
    cachedVerifier = CognitoJwtVerifier.create({
      userPoolId: getEnv('COGNITO_USER_POOL_ID'),
      tokenUse: 'id',
      clientId: getEnv('COGNITO_USER_POOL_CLIENT_ID'),
    });
  }
  return cachedVerifier;
}

/**
 * Verifies a raw Cognito access token JWT and maps its claims onto
 * `AuthenticatedUser`. Callers only need to handle `UnauthorizedError` —
 * `aws-jwt-verify`'s specific error types are intentionally not leaked
 * past this module.
 */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  try {
    const payload = await getVerifier().verify(token);
    return {
      sub: payload.sub,
      username: (payload['cognito:username'] as string | undefined) ?? payload.sub,
      role: (payload['custom:role'] as string | undefined) ?? 'Viewer',
      claims: payload as Record<string, unknown>,
    };
  } catch (error) {
    throw new UnauthorizedError(error instanceof Error ? error.message : 'Token verification failed');
  }
}

/**
 * Extracts a bearer token from an API Gateway proxy event's headers.
 * API Gateway lower-cases header names in some invocation paths but not
 * others, so both casings are checked.
 */
export function extractBearerToken(
  headers: Record<string, string | undefined> | null | undefined,
): string | null {
  if (!headers) return null;
  const raw = headers['Authorization'] ?? headers['authorization'];
  if (!raw) return null;

  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
