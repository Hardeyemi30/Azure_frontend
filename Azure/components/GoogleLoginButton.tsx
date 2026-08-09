"use client";

import {
  GoogleLogin,
} from "@react-oauth/google";

import { useState } from "react";
import { useAuth } from "../contexts/authContext";

export default function GoogleLoginButton() {
  const { googleLogin } =
    useAuth();

  const [error, setError] =
    useState("");

  async function handleSuccess(
    credentialResponse: {
      credential?: string;
    }
  ) {
    setError("");

    if (
      !credentialResponse.credential
    ) {
      setError(
        "Google did not return a valid login credential."
      );

      return;
    }

    try {
      await googleLogin(
        credentialResponse.credential
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Google login failed."
      );
    }
  }

  return (
    <div>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={
            handleSuccess
          }
          onError={() =>
            setError(
              "Google login was unsuccessful."
            )
          }
          useOneTap={false}
        />
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}