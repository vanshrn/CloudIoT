import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@shared/logger';
import { getEnv } from '@shared/env';

const logger = new Logger({ service: 'websocket-disconnect' });
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
    logger.info(`Disconnecting client: ${connectionId}`);
    
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: {
        connectionId,
      },
    }));

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    logger.error(`Failed to disconnect client: ${error}`);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
