import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse as JSON first to get structured error message
    let errorMessage = res.statusText;
    let errorCode: string | undefined;
    let errorData: any = {};
    
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await res.clone().json();
        errorMessage = errorData.error || errorData.message || res.statusText;
        errorCode = errorData.code;
      } else {
        const text = await res.text();
        errorMessage = text || res.statusText;
      }
    } catch {
      // If parsing fails, use status text
      errorMessage = res.statusText;
    }
    
    const error = new Error(errorMessage) as Error & { status?: number; code?: string; data?: any };
    error.status = res.status;
    error.code = errorCode;
    error.data = errorData;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token if user is logged in
  let authToken: string | null = null;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      authToken = await currentUser.getIdToken();
    }
  } catch (error) {
    // If token fetch fails, continue without token
    console.warn("Failed to get auth token:", error);
  }
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
