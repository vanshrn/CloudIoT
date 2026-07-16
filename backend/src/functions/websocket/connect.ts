import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@shared/logger';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'websocket-connect' });
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    logger.error('No connectionId found in request');
    return { statusCode: 400, body: 'Bad Request' };
  }

  const tableName = getEnv('CONNECTIONS_TABLE');

  try {
    logger.info(`Connecting client: ${connectionId}`);
    
    // Auto-expire connections after 24 hours
    const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        connectionId,
        ttl,
        connectedAt: new Date().toISOString(),
      },
    }));

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    logger.error(`Failed to connect client: ${error}`);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};
