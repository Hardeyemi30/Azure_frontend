"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useAuth } from "../contexts/authContext";
import GoogleLoginButton from "./GoogleLoginButton";

interface RegisterFormProps {
  onShowLogin: () => void;
}

export default function RegisterForm({
  onShowLogin,
}: RegisterFormProps) {
  const { register } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName =
      name.trim();

    const trimmedEmail =
      email.trim().toLowerCase();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please complete all required fields."
      );

      return;
    }

    if (
      !trimmedEmail.includes("@")
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      setSuccess(
        "Account created successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // If your register function automatically logs
      // the user in, you can remove this timeout.
      //
      // If registration should return the user to
      // the login screen, keep it.
      setTimeout(() => {
        onShowLogin();
      }, 1200);
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Azure Nutrition Analytics
        </p>

        <h1 className="text-3xl font-bold text-white">
          Create an account
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Register to access the dashboard
          and explore recipes.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Registration form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Full name */}
        <div>
          <label
            htmlFor="register-name"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Full name
          </label>

          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Your name"
            autoComplete="name"
            disabled={loading}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Email
          </label>

          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Password
          </label>

          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Confirm password
          </label>

          <input
            id="register-confirm-password"
            type="password"
            value={
              confirmPassword
            }
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder="Enter password again"
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Creating account..."
            : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-700" />

        <span className="text-xs uppercase text-slate-500">
          or
        </span>

        <div className="h-px flex-1 bg-slate-700" />
      </div>

      {/* Google authentication */}
      <GoogleLoginButton />

      {/* Login switch */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Already registered?{" "}

        <button
          type="button"
          onClick={onShowLogin}
          disabled={loading}
          className="font-medium text-emerald-400 transition hover:text-emerald-300 disabled:opacity-60"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}