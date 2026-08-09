"use client";

import "./globals.css";

import {
  GoogleOAuthProvider,
} from "@react-oauth/google";

import {
  AuthProvider,
} from "../contexts/authContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId =
    process.env
      .NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider
          clientId={
            googleClientId
          }
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}