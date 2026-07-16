import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Central Axios instance — Phase 15.2.5 (updated from stub).
 *
 * Points at VITE_API_BASE_URL (set from the `ApiUrl` CDK output).
 * When the env var is absent the base URL falls back to the empty string so
 * requests are relative — the real API is unreachable, which is intentional:
 * pages that use mock data still work; pages that call the real API will
 * surface a network error that the consuming hook handles gracefully.
 *
 * Request interceptor: attaches `Authorization: Bearer <access_token>` from
 * the active Amplify session. If there is no session (e.g. the user is not
 * signed in) the header is omitted and the backend returns 401, which is the
 * correct behaviour — ProtectedRoute ensures this can only happen if the
 * Cognito session is stale.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No active session — let the request proceed without a token.
    // The backend will return 401 and the calling hook surfaces the error.
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error normalization — pass through for now so each
    // hook can decide how to surface the error in the UI.
    return Promise.reject(error);
  }
);
