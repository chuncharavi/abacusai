import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";

// Configure global auth token getter so all API calls include the JWT
setAuthTokenGetter(() => localStorage.getItem("abacusai_token"));

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("abacusai_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      queryKey: ['me', token],
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("abacusai_token", token);
    } else {
      localStorage.removeItem("abacusai_token");
    }
  }, [token]);

  const login = (newToken: string) => {
    // Write to localStorage immediately so the token getter has it before refetch fires
    localStorage.setItem("abacusai_token", newToken);
    setToken(newToken);
    setTimeout(() => refetch(), 50);
  };

  const logout = () => {
    localStorage.removeItem("abacusai_token");
    setToken(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading: isUserLoading && !!token,
      login,
      logout,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
