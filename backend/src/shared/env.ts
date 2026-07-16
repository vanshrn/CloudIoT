/**
 * Typed access to Lambda environment variables.
 *
 * CDK injects environment variables (stage, region, table names, etc.) at
 * deploy time via the Lambda's `environment` property — see
 * lib/constructs/api-function.ts. This module centralizes reading them so
 * a missing variable fails fast with a clear error instead of surfacing as
 * `undefined` deep inside business logic.
 */

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnvOptional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const stage = getEnvOptional('STAGE', 'dev');
export const awsRegion = getEnvOptional('AWS_REGION', 'us-east-1');
