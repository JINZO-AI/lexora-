// API client helper - wraps fetch with auth + JSON handling

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (contentType.includes("application/json")) {
      try {
        const data = await res.json();
        message = data.error || data.message || message;
      } catch {
        // keep default
      }
    }
    throw new ApiError(message, res.status);
  }

  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text() as unknown as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: "POST", body: formData }),
};
