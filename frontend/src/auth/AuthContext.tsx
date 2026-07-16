import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as cognito from './cognitoClient';
import type { AuthSession } from './cognitoClient';

/**
 * App-wide authentication state — Phase 14.2.
 *
 * Restores an existing Cognito session on mount (so a page refresh doesn't
 * bounce a signed-in user back to /login), and exposes signIn/signOut for
 * the rest of the app to call. No JWT validation and no API Gateway calls
 * happen here — this only tracks the Cognito session client-side.
 *
 * `signIn` can pause mid-flow when Cognito challenges the user to set a
 * new permanent password (`CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED`,
 * e.g. for admin-created accounts). That's surfaced via
 * `newPasswordRequired`; `completeNewPassword` finishes the sign-in once
 * the user supplies one, and `cancelNewPassword` backs out to the login
 * form.
 */
interface AuthContextValue {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  newPasswordRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  cancelNewPassword: () => void;
  signOut: () => void;
  updateSession: (attributes: { name?: string; picture?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    cognito
      .restoreSession()
      .then((session) => {
        if (!cancelled) setUser(session);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await cognito.signIn(email, password);
      if (result.status === 'NEW_PASSWORD_REQUIRED') {
        setNewPasswordRequired(true);
        return;
      }
      setNewPasswordRequired(false);
      setUser(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
      throw err;
    }
  }, []);

  const completeNewPassword = useCallback(async (newPassword: string) => {
    setError(null);
    try {
      const result = await cognito.completeNewPassword(newPassword);
      if (result.status === 'NEW_PASSWORD_REQUIRED') {
        // Shouldn't normally happen (Cognito would ask again only on failure),
        // but guard against it rather than assuming success.
        return;
      }
      setNewPasswordRequired(false);
      setUser(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to set new password.');
      throw err;
    }
  }, []);

  const cancelNewPassword = useCallback(() => {
    setNewPasswordRequired(false);
    setError(null);
    cognito.signOut();
  }, []);

  const signOut = useCallback(() => {
    cognito.signOut();
    setUser(null);
    setNewPasswordRequired(false);
  }, []);

  const updateSession = useCallback((attributes: { name?: string; picture?: string }) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: attributes.name || prev.name,
        picture: attributes.picture || prev.picture,
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        newPasswordRequired,
        signIn,
        completeNewPassword,
        cancelNewPassword,
        signOut,
        updateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
