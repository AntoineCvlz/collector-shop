import { apiFetch } from "../api/client";

export type Role = "buyer" | "seller" | "admin" | "moderator";

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  roles: Role[];
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
  user_info: UserInfo;
}

export interface MeResponse {
  response_code: number;
  status: string;
  message: string;
  user_info: UserInfo;
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

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
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

export const getMe = async (token: string): Promise<MeResponse> => {
  return apiFetch<MeResponse>("/api/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateProfile = async (
  token: string,
  payload: UpdateProfilePayload,
): Promise<MeResponse> => {
  return apiFetch<MeResponse>("/api/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
};

export const logout = async (token: string): Promise<void> => {
  await apiFetch("/api/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
