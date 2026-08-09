"use client";

import {
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/authContext";

import Dashboard from "@/components/Dashboard";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function Home() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const [
    authMode,
    setAuthMode,
  ] =
    useState<
      "login" | "register"
    >("login");

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />

          <p className="mt-4 text-sm text-slate-400">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      {authMode ===
      "login" ? (
        <LoginForm
          onShowRegister={() =>
            setAuthMode(
              "register"
            )
          }
        />
      ) : (
        <RegisterForm
          onShowLogin={() =>
            setAuthMode(
              "login"
            )
          }
        />
      )}
    </main>
  );
}