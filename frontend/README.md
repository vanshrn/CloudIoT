# CloudIoT Frontend

This directory contains the user interface for the CloudIoT fleet console. 

## Technology Stack

- **React 19**
- **TypeScript**
- **Vite** (Build Tool)
- **Material UI** (Component Library)
- **Recharts** (Data Visualization)

## Directory Structure

- **`src/`**: Contains the main application source code.
  - `api/`: API clients and interceptors.
  - `auth/`: Authentication contexts and providers.
  - `components/`: Reusable React components.
  - `config/`: Application configuration settings.
  - `constants/`: Global constants.
  - `hooks/`: Custom React hooks.
  - `layouts/`: Page layout components.
  - `pages/`: Top-level page components.
  - `theme/`: Material UI theme definitions.
  - `types/`: TypeScript type definitions.
- **`public/`**: Static assets that bypass Vite's build processing.

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code issues.

## Environment Variables

Copy the `.env.example` file to `.env` to configure your environment:

```bash
cp .env.example .env
```
Make sure to set `VITE_API_BASE_URL` and other required variables to connect to your backend environment.
