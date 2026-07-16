const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic param fixes
      content = content.replace(/event: APIGatewayProxyEvent/g, '_event: APIGatewayProxyEvent');
      content = content.replace(/user: AuthenticatedUser/g, '_user: AuthenticatedUser');
      
      // Specific file fixes
      if (fullPath.includes('create-deployment.ts') || fullPath.includes('create-firmware.ts') || fullPath.includes('create-rollback.ts')) {
        content = content.replace(/import { ok, badRequest, internalError, created } from '@shared\/http';/g, "import { badRequest, internalError, created } from '@shared/http';");
      }
      
      if (fullPath.includes('get-upload-url.ts')) {
        content = content.replace(/import { ok, internalError } from '@shared\/http';/g, "import { internalError } from '@shared/http';");
        content = content.replace(/return ok\(\{ uploadUrl, s3Key \}\);/g, "return { statusCode: 200, headers: {}, body: JSON.stringify({ uploadUrl, s3Key }) };");
      }

      fs.writeFileSync(fullPath, content);
    }
  }
};

walk('src/functions');
