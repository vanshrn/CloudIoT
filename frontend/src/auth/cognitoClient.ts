import { Amplify } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignIn as amplifyConfirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  updateUserAttributes,
  fetchUserAttributes,
  updatePassword as amplifyUpdatePassword,
} from 'aws-amplify/auth';
import { getCognitoConfig } from '@/config/auth';

/**
 * Thin wrapper around AWS Amplify Auth (v6) — Phase 14.2 (revised).
 *
 * Replaces the original `amazon-cognito-identity-js` implementation, which
 * fails under Vite with `Uncaught ReferenceError: global is not defined`
 * (the package assumes a Node/webpack global that Vite doesn't polyfill).
 * Amplify v6's modular `aws-amplify/auth` entrypoint is bundler-friendly
 * out of the box and needs no Node polyfills.
 *
 * Talks directly to the Cognito User Pool deployed in Phase 14.1 (USER_SRP_AUTH,
 * no Hosted UI — matching `disableOAuth: true` on the User Pool Client).
 * Nothing here validates JWTs or calls API Gateway; that's a later phase.
 *
 * `signIn` can come back asking for a new permanent password (Cognito's
 * `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED` challenge, e.g. for
 * admin-created users). Callers handle that via the `NEW_PASSWORD_REQUIRED`
 * result and `completeNewPassword`.
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const config = getCognitoConfig();
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
      },
    },
  });
  configured = true;
}

export interface AuthSession {
  email: string;
  name: string;
  role: string;
  picture?: string;
  idToken: string;
  accessToken: string;
}

export type SignInResult =
  | { status: 'SIGNED_IN'; session: AuthSession }
  | { status: 'NEW_PASSWORD_REQUIRED' };

/** Reads the current Amplify session/tokens, or null if there isn't a valid one. */
async function toAuthSession(): Promise<AuthSession | null> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken;
  const accessToken = session.tokens?.accessToken;
  if (!idToken || !accessToken) {
    return null;
  }

  const { username } = await getCurrentUser();
  const email = (idToken.payload?.email as string | undefined) ?? username;
  const role = (idToken.payload?.['custom:role'] as string | undefined) ?? 'Viewer';
  
  let name = (idToken.payload?.name as string | undefined) ?? email.split('@')[0];
  try {
    const liveAttrs = await fetchUserAttributes();
    if (liveAttrs.name) {
      name = liveAttrs.name;
    }
  } catch {
    // Ignore, fallback to token claims
  }
  
  let picture = idToken.payload?.picture as string | undefined;
  if (!picture) {
    try {
      picture = localStorage.getItem(`profile_pic_${email}`) || undefined;
    } catch {
      // Ignore localStorage errors
    }
  }

  return {
    email,
    name,
    role,
    picture,
    idToken: idToken.toString(),
    accessToken: accessToken.toString(),
  };
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  ensureConfigured();

  const { isSignedIn, nextStep } = await amplifySignIn({ username: email, password });
  return handleSignInStep(isSignedIn, nextStep);
}

/**
 * Completes an in-progress `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED`
 * challenge with the user's chosen permanent password.
 */
export async function completeNewPassword(newPassword: string): Promise<SignInResult> {
  ensureConfigured();

  const { isSignedIn, nextStep } = await amplifyConfirmSignIn({ challengeResponse: newPassword });
  return handleSignInStep(isSignedIn, nextStep);
}

async function handleSignInStep(
  isSignedIn: boolean,
  nextStep: { signInStep: string }
): Promise<SignInResult> {
  if (isSignedIn) {
    const session = await toAuthSession();
    if (!session) {
      throw new Error('Signed in, but no session tokens were returned.');
    }
    return { status: 'SIGNED_IN', session };
  }

  if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
    return { status: 'NEW_PASSWORD_REQUIRED' };
  }

  // Covers flows this app doesn't support yet (MFA challenges, etc).
  throw new Error(`Sign-in requires an additional step (${nextStep.signInStep}), which isn't supported yet.`);
}

export function signOut(): void {
  ensureConfigured();
  void amplifySignOut();
}

/** Restores a previously-authenticated session (e.g. after a page refresh) from local storage. */
export function restoreSession(): Promise<AuthSession | null> {
  ensureConfigured();
  return toAuthSession().catch(() => null);
}

export async function updateProfile(attributes: { name?: string; picture?: string }) {
  ensureConfigured();
  await updateUserAttributes({
    userAttributes: {
      ...(attributes.name ? { name: attributes.name } : {}),
      ...(attributes.picture ? { picture: attributes.picture } : {})
    }
  });
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<void> {
  ensureConfigured();
  await amplifyUpdatePassword({ oldPassword, newPassword });
}
