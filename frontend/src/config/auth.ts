/**
 * Cognito configuration — Phase 14.2.
 *
 * Read from Vite env vars rather than hardcoded, since the User Pool /
 * Client IDs are generated per-stage by the Phase 14.1 `AuthStack` CDK
 * deploy (see backend/lib/stacks/auth-stack.ts CfnOutputs). Copy
 * `frontend/.env.example` to `frontend/.env` and fill in the stack outputs
 * for the stage you're pointing at.
 */
export interface CognitoConfig {
  userPoolId: string;
  userPoolClientId: string;
  region: string;
}

let cachedConfig: CognitoConfig | null = null;

function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy frontend/.env.example to ` +
        'frontend/.env and fill in the Cognito values from the Phase 14.1 AuthStack outputs.'
    );
  }
  return value;
}

/** Lazily read + validate the Cognito env vars on first use (not at module load). */
export function getCognitoConfig(): CognitoConfig {
  if (!cachedConfig) {
    cachedConfig = {
      userPoolId: requireEnvVar('VITE_COGNITO_USER_POOL_ID', import.meta.env.VITE_COGNITO_USER_POOL_ID),
      userPoolClientId: requireEnvVar(
        'VITE_COGNITO_USER_POOL_CLIENT_ID',
        import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID
      ),
      region: requireEnvVar('VITE_COGNITO_REGION', import.meta.env.VITE_COGNITO_REGION),
    };
  }
  return cachedConfig;
}
