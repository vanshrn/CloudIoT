import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@shared/logger';
import { ok, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import type { AuthenticatedUser } from '@shared/types';
import { getEnv } from '@shared/env';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const logger = new Logger({ service: 'ota-get-upload-url' });
const s3 = new S3Client({});

export const handler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: Context,
    _user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    
    const key = `firmware-${Date.now()}.bin`;
    const bucket = getEnv('FIRMWARE_BUCKET_NAME');

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'application/octet-stream',
      });
      
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      
      return ok({ uploadUrl, key });
    } catch (err) {
      log.error('Failed to generate upload URL', err);
      return internalError();
    }
  },
  ['Administrator', 'Operator']
);
