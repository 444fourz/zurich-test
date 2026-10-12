import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  fetchCurrentUser,
  getToken,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/client";
import type { AuthUser, RegisterInput } from "../api/client";

interface AuthContextValue {
  user: AuthUser | null;
  /** True while a saved session is being checked on page load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => getToken() !== null);

  // Restore the session if a token was saved earlier in this tab.
  useEffect(() => {
    if (getToken() === null) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await loginUser(email, password));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setUser(await registerUser(input));
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
