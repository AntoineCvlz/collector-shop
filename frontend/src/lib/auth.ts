import type { Role, UserInfo } from "../services/auth.service";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function saveSession(token: string, user: UserInfo): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function hasRole(role: Role, user: UserInfo | null = getUser()): boolean {
  return user?.roles?.includes(role) ?? false;
}

export function isAdmin(user: UserInfo | null = getUser()): boolean {
  return hasRole("admin", user);
}

export function isSeller(user: UserInfo | null = getUser()): boolean {
  return hasRole("seller", user);
}
