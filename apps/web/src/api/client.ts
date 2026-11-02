async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  company: string;
  role: "user" | "admin";
  isActive?: boolean;
  createdAt?: string;
  loginLinkEnabled?: boolean;
}

export interface Bill {
  _id: string;
  userId: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  capturedAt: string;
  dayKey: string;
}

export interface DayGroup {
  dayKey: string;
  bills: Bill[];
}

export interface AdminUserGroup {
  user: User;
  days: DayGroup[];
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiFetch<User>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    me: () => apiFetch<User>("/api/auth/me"),
    linkPreview: (userId: string) =>
      apiFetch<{ displayName: string; company: string }>("/api/auth/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
    linkLogin: (userId: string) =>
      apiFetch<User>("/api/auth/link-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
  },
  bills: {
    save: (data: {
      path: string;
      originalName: string;
      mimeType: string;
      size: number;
    }) =>
      apiFetch<Bill>("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    mine: () => apiFetch<DayGroup[]>("/api/bills/mine"),
    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/bills/${id}`, { method: "DELETE" }),
  },
  admin: {
    users: {
      list: () => apiFetch<User[]>("/api/admin/users"),
      create: (data: {
        username: string;
        displayName: string;
        company?: string;
        password: string;
        role?: string;
      }) =>
        apiFetch<User>("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      update: (
        id: string,
        data: Partial<{
          displayName: string;
          company: string;
          isActive: boolean;
          password: string;
          loginLinkEnabled: boolean;
        }>
      ) =>
        apiFetch<User>(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
    },
    bills: {
      list: (userId?: string) =>
        apiFetch<AdminUserGroup[]>(
          `/api/admin/bills${userId ? `?userId=${userId}` : ""}`
        ),
      delete: (id: string) =>
        apiFetch<{ ok: boolean }>(`/api/admin/bills/${id}`, {
          method: "DELETE",
        }),
    },
  },
};

