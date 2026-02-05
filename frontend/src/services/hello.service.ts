import { apiFetch } from "../api/client";

export const fetchHello = async () => {
  return apiFetch<{ message: string }>("/api/hello-world");
};