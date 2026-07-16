# CloudIoT Project

This repository contains the CloudIoT project, which is structured into two main components:

- **`frontend/`**: A React application built with Vite, TypeScript, and Material UI.
- **`backend/`**: A Node.js serverless backend utilizing AWS SDKs, constructed using AWS CDK.

## Getting Started

### Frontend Setup

To run the frontend application locally:

```bash
cd frontend
npm install
npm run dev
```

Ensure you configure your environment variables based on `frontend/.env.example`.

### Backend Setup

To work with the backend:

```bash
cd backend
npm install
npm run build
```

Configure your environment variables by copying `backend/.env.example` to `backend/.env`.

## Project Navigation

For more details on each subsystem, please refer to their respective READMEs:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
