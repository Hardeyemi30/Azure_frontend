"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useAuth } from "../contexts/authContext";
import GoogleLoginButton from "./GoogleLoginButton";

interface LoginFormProps {
  onShowRegister: () => void;
}

export default function LoginForm({
  onShowRegister,
}: LoginFormProps) {
  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      await login({
        email,
        password,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-emerald-400">
          Azure Nutrition Analytics
        </p>

        <h1 className="text-3xl font-bold text-white">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your nutritional dashboard.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-700" />

        <span className="text-xs uppercase text-slate-500">
          or
        </span>

        <div className="h-px flex-1 bg-slate-700" />
      </div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}

        <button
          type="button"
          onClick={onShowRegister}
          className="font-medium text-emerald-400 hover:text-emerald-300"
        >
          Register
        </button>
      </p>
    </div>
  );
}