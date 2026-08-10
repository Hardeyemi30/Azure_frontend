"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  loginWithGoogle,
  registerUser,
} from "@/services/authApi";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    credentials: LoginRequest
  ) => Promise<void>;

  register: (
    registration: RegisterRequest
  ) => Promise<void>;

  googleLogin: (
    credential: string
  ) => Promise<void>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  // Important:
  // Always start the same on server and client.
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  // true while restoring browser session
  const [loading, setLoading] =
    useState(true);

  /* =====================================
     RESTORE SESSION
  ===================================== */

  useEffect(() => {
    async function restoreSession() {
      await Promise.resolve();

      try {
        const storedToken =
          localStorage.getItem(
            "accessToken"
          );
        const storedUser =
          localStorage.getItem(
            "user"
          );

        if (
          storedToken &&
          storedUser
        ) {
          const parsedUser =
            JSON.parse(
              storedUser
            ) as User;

          setToken(storedToken);
          setUser(parsedUser);
        } else {
          // Prevent partial/broken sessions
          localStorage.removeItem(
            "accessToken"
          );

          localStorage.removeItem(
            "user"
          );

          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Unable to restore authentication session:",
          error
        );

        localStorage.removeItem(
          "accessToken"
        );

        localStorage.removeItem(
          "user"
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  /* =====================================
     LOGOUT
  ===================================== */

  const logout = useCallback(() => {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "user"
    );

    setToken(null);
    setUser(null);
  }, []);

  /* =====================================
     HANDLE 401 / UNAUTHORIZED
  ===================================== */

  useEffect(() => {
    function handleUnauthorized() {
      logout();
    }

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized
      );
    };
  }, [logout]);

  /* =====================================
     SAVE SESSION
  ===================================== */

  const saveSession =
    useCallback(
      (
        newToken: string,
        newUser: User
      ) => {
        localStorage.setItem(
          "accessToken",
          newToken
        );

        localStorage.setItem(
          "user",
          JSON.stringify(newUser)
        );

        setToken(newToken);
        setUser(newUser);
      },
      []
    );

  /* =====================================
     EMAIL / PASSWORD LOGIN
  ===================================== */

  async function login(
    credentials: LoginRequest
  ): Promise<void> {
    const response =
      await loginUser(
        credentials
      );

    if (
      !response.token ||
      !response.user
    ) {
      console.error(
        "Invalid login response:",
        response
      );

      throw new Error(
        "The server did not return a valid login session."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  /* =====================================
     REGISTER
  ===================================== */

  async function register(
    registration: RegisterRequest
  ): Promise<void> {
    const response =
      await registerUser(
        registration
      );

    if (
      !response.token ||
      !response.user
    ) {
      console.error(
        "Invalid registration response:",
        response
      );

      throw new Error(
        "Registration succeeded but no session was returned."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  /* =====================================
     GOOGLE LOGIN
  ===================================== */

  async function googleLogin(
    credential: string
  ): Promise<void> {
    const response =
      await loginWithGoogle({
        credential,
      });

    if (
      !response.token ||
      !response.user
    ) {
      console.error(
        "Invalid Google login response:",
        response
      );

      throw new Error(
        "Google authentication failed."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  /* =====================================
     PROVIDER
  ===================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,

        isAuthenticated:
          Boolean(
            user &&
              token
          ),

        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================
   AUTH HOOK
===================================== */

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}