import { apiFetch } from "../api/client";

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  response_code: number;
  status: string;
  message: string;
  user_info: UserInfo;
  token: string;
}

export interface RegisterResponse {
  response_code: number;
  status: string;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  return apiFetch<LoginResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  return apiFetch<RegisterResponse>("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const logout = async (token: string): Promise<void> => {
  await apiFetch("/api/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
