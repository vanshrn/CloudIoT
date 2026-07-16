# CloudIoT Backend

This directory contains the AWS serverless backend for the CloudIoT project.

## Directory Structure

- **`src/`**: Contains the main source code.
  - **`functions/`**: Contains Lambda handler functions for various domains such as:
    - `alerts/`
    - `analytics/`
    - `auth-me/`
    - `devices/`
    - `hello-world/`
    - `ota/`
    - `telemetry/`
    - `users/`
    - `websocket/`
  - **`shared/`**: Shared utilities used across different functions (e.g., HTTP wrappers, auth logic).
- **`test/`**: Jest test suite covering the backend functionality.

## Available Scripts

In the project directory, you can run:

- `npm run build`: Compiles the TypeScript code.
- `npm run watch`: Runs the TypeScript compiler in watch mode.
- `npm run lint`: Runs ESLint over the source files.
- `npm run format`: Formats code files using Prettier.
- `npm test`: Runs the test suite using Jest.
- `npm run deploy`: Deploys the AWS CDK stacks.

## Environment Variables

Copy the `.env.example` file to `.env` and configure your environment variables before running deployment scripts or local tests:

```bash
cp .env.example .env
```
