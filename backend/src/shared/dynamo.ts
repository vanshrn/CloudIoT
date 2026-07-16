/**
 * Shared DynamoDB DocumentClient singleton — Phase 15.2.
 *
 * A single DocumentClient instance is created at module load time (Lambda
 * cold start) and reused across warm invocations. DynamoDB SDK v3 does not
 * maintain a persistent TCP connection per se, but reusing the client object
 * avoids repeated credential resolution and config parsing on every request.
 *
 * Uses the DynamoDB Document client from the AWS SDK v3 (`@aws-sdk/lib-dynamodb`),
 * which transparently marshals JavaScript values to/from DynamoDB's AttributeValue
 * format — handlers work with plain objects, not `{ S: "..." }` wrappers.
 *
 * The AWS SDK v3 packages are available in the Lambda Node.js 20 runtime
 * without bundling, but esbuild (via ApiFunction / NodejsFunction) bundles them
 * anyway to guarantee the exact version used in tests matches production.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const raw = new DynamoDBClient({});

/**
 * DocumentClient singleton — import this in every repository module instead of
 * constructing a new client. Marshalling options strip undefined values from
 * items so partial updates never accidentally write `null` into attributes that
 * were intentionally omitted.
 */
export const docClient = DynamoDBDocumentClient.from(raw, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
