/**
 * Shared TypeScript types used across Lambda functions.
 *
 * Deliberately sparse in this phase — no domain models exist yet (Device,
 * Alert, Telemetry, etc. land in future phases). This file exists so those
 * types have an obvious home from day one instead of being duplicated
 * per-function or bolted onto the frontend's `src/types/`.
 */

/** Standard success envelope for simple health/status endpoints. */
export interface HealthCheckResponse {
  status: 'ok';
  service: string;
  stage: string;
  timestamp: string;
}

/**
 * Identity extracted from a validated Cognito access token — Phase 14.3.
 * Populated by shared/auth.ts and handed to handlers via shared/middleware.ts
 * (`withAuth`). `claims` carries the full verified JWT payload for handlers
 * that need a claim not modeled explicitly above (e.g. `scope`, `client_id`).
 */
export interface AuthenticatedUser {
  /** Cognito `sub` claim — stable, unique user id. */
  sub: string;
  /** Cognito `cognito:username` claim. */
  username: string;
  /** Role from custom:role attribute. */
  role: string;
  /** Full verified token payload. */
  claims: Record<string, unknown>;
}
