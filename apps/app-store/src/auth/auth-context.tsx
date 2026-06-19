import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  getUsersControllerGetMeQueryKey,
  queryClient,
  setAuthToken,
  type PublicUserDto,
} from '@/api';

import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from './token-storage';

type AuthContextValue = {
  /** Bearer token, or null when signed out. */
  session: string | null;
  /** True until the persisted token has been read from storage on startup. */
  isLoading: boolean;
  /** Persist the token, seed the user cache, and authenticate axios. */
  signIn: (accessToken: string, user: PublicUserDto) => Promise<void>;
  /** Clear the token and reset all cached server state. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be used within a <SessionProvider />');
  }
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate the token from secure storage once on startup.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getStoredToken();
        if (!active) return;
        if (token) {
          setAuthToken(token);
          setSession(token);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (accessToken, user) => {
    setAuthToken(accessToken);
    await setStoredToken(accessToken);
    // Seed the cache so screens reading the current user render immediately.
    queryClient.setQueryData(getUsersControllerGetMeQueryKey(), user);
    setSession(accessToken);
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    setAuthToken(null);
    await clearStoredToken();
    queryClient.clear();
    setSession(null);
  };

  return (
    <AuthContext value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}
