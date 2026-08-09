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

import {
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
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const storedUser = localStorage.getItem("user");
      return storedUser ? (JSON.parse(storedUser) as User) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

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

  // Session is restored synchronously via useState initializers above

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

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

  function saveSession(
    newToken: string,
    newUser: User
  ) {
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
  }

  async function login(
    credentials: LoginRequest
  ) {
    const response =
      await loginUser(credentials);

    if (
      !response.token ||
      !response.user
    ) {
      throw new Error(
        "The server did not return a valid login session."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  async function register(
    registration: RegisterRequest
  ) {
    const response =
      await registerUser(
        registration
      );

    if (
      !response.token ||
      !response.user
    ) {
      throw new Error(
        "Registration succeeded but no session was returned."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  async function googleLogin(
    credential: string
  ) {
    const response =
      await loginWithGoogle({
        credential,
      });

    if (
      !response.token ||
      !response.user
    ) {
      throw new Error(
        "Google authentication failed."
      );
    }

    saveSession(
      response.token,
      response.user
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated:
          Boolean(user && token),
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

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}