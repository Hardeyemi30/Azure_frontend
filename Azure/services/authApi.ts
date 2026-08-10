import {
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

async function handleResponse(
  response: Response
): Promise<AuthResponse> {
  let data: AuthResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        "Authentication request failed."
    );
  }

  return data;
}

export async function loginUser(
  credentials: LoginRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify(credentials),
  });

  return handleResponse(response);
}

export async function registerUser(
  registration: RegisterRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify(registration),
  });

  return handleResponse(response);
}

export async function loginWithGoogle(
  request: GoogleLoginRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify(request),
  });

  return handleResponse(response);
}