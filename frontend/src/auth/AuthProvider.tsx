import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchCurrentUser,
  login,
  logout,
  type LoginResult,
  type SessionUser,
} from "../api/auth";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type InitialAuth = {
  status: AuthStatus;
  user: SessionUser | null;
};

type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
};

type AuthContextValue = AuthState & {
  signIn: (username: string, password: string) => Promise<LoginResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolvedState(user: SessionUser | null): AuthState {
  return user === null
    ? { status: "anonymous", user: null }
    : { status: "authenticated", user };
}

type AuthProviderProps = {
  children: ReactNode;
  /**
   * Seed the auth state synchronously and skip the mount `/me` fetch. Used by
   * tests; production renders without it and re-fetches the session on load.
   */
  initialAuth?: InitialAuth;
};

export function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(
    () => initialAuth ?? { status: "loading", user: null },
  );

  useEffect(() => {
    if (initialAuth !== undefined) {
      return;
    }

    let active = true;
    fetchCurrentUser()
      .then((user) => {
        if (active) {
          setState(resolvedState(user));
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "anonymous", user: null });
        }
      });

    return () => {
      active = false;
    };
  }, [initialAuth]);

  const signIn = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const result = await login(username, password);
      if (result.ok) {
        setState({ status: "authenticated", user: result.user });
      }
      return result;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await logout();
    } finally {
      setState({ status: "anonymous", user: null });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
