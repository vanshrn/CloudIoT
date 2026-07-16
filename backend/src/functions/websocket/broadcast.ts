import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Logger } from '@shared/logger';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'websocket-broadcast' });
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

let apigwClient: ApiGatewayManagementApiClient;

export const handler = async (event: DynamoDBStreamEvent) => {
  const tableName = getEnv('CONNECTIONS_TABLE');
  const endpoint = getEnv('WEBSOCKET_API_ENDPOINT');

  if (!apigwClient) {
    apigwClient = new ApiGatewayManagementApiClient({ endpoint });
  }

  // 1. Process stream records into unified payload
  const payloads: any[] = [];

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;
    if (!record.dynamodb?.NewImage) continue;

    const item = unmarshall(record.dynamodb.NewImage as any);

    // Identify if it's an alert or telemetry based on attributes
    if (item.alertId) {
      payloads.push({
        type: 'alert',
        data: item,
      });
    } else if (item.timestamp && item.deviceId) {
      payloads.push({
        type: 'telemetry',
        data: item,
      });
    }
  }

  if (payloads.length === 0) return;

  const messageString = JSON.stringify({ type: 'batch', payloads });

  // 2. Fetch all active connections
  // In a real production app with many connections, this scan should be handled via a 
  // pub/sub mechanism like IoT Core or Redis, or paginated, but for now it's okay.
  try {
    const connectionsResponse = await docClient.send(new ScanCommand({
      TableName: tableName,
      ProjectionExpression: 'connectionId',
    }));

    const connections = connectionsResponse.Items || [];

    if (connections.length === 0) {
      logger.info('No active connections to broadcast to');
      return;
    }

    // 3. Broadcast to all connections
    const postCalls = connections.map(async (connection) => {
      const connectionId = connection.connectionId;
      try {
        await apigwClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: new TextEncoder().encode(messageString),
        }));
      } catch (err: any) {
        if (err.$metadata?.httpStatusCode === 410) {
          // Stale connection, delete it
          await docClient.send(new DeleteCommand({
            TableName: tableName,
            Key: { connectionId },
          }));
        } else {
          logger.error(`Failed to post to connection ${connectionId}: ${err}`);
        }
      }
    });

    await Promise.all(postCalls);
    logger.info(`Broadcasted ${payloads.length} events to ${connections.length} connections`);
  } catch (error) {
    logger.error(`Failed to broadcast: ${error}`);
  }
};
