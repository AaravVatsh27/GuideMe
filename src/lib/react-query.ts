import type { QueryClientConfig } from "@tanstack/react-query";

type QueryFilters = Record<string, string | number | boolean | null | undefined>;

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    status?: unknown;
    response?: { status?: unknown };
    cause?: { status?: unknown };
  };
  const status = candidate.response?.status ?? candidate.status ?? candidate.cause?.status;

  return typeof status === "number" ? status : null;
}

/**
 * Standardized query keys factory for GuideMe.
 * Centralizing keys prevents cache collisions and makes invalidation easier.
 */
export const queryKeys = {
  mentors: {
    all: ["mentors"] as const,
    lists: ["mentors", "list"] as const,
    list: (filters: QueryFilters = {}) => ["mentors", "list", filters] as const,
    detail: (username: string) => [...queryKeys.mentors.all, "detail", username] as const,
    availability: (mentorId: string, date?: string) =>
      ["mentors", "availability", mentorId, date ?? "current"] as const,
  },
  search: {
    all: ["search"] as const,
    results: (filters: QueryFilters = {}) => ["search", "results", filters] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    lists: ["sessions", "list"] as const,
    list: (filters: QueryFilters = {}) => ["sessions", "list", filters] as const,
    detail: (id: string) => [...queryKeys.sessions.all, "detail", id] as const,
    student: {
      all: ["sessions", "student"] as const,
      list: (tab: string) => ["sessions", "student", tab] as const,
    },
    mentor: {
      all: ["sessions", "mentor"] as const,
      list: (filters: QueryFilters = {}) => ["sessions", "mentor", filters] as const,
    },
  },
  student: {
    all: ["student"] as const,
    dashboard: ["student", "dashboard"] as const,
    profile: ["student", "profile", "me"] as const,
    savedMentors: ["student", "saved-mentors"] as const,
    matching: ["student", "matching", "me"] as const,
  },
  admin: {
    all: ["admin"] as const,
    stats: ["admin", "stats"] as const,
  },
};

/**
 * Default React Query configuration.
 * - staleTime: 5 minutes (data remains "fresh" for 5m)
 * - gcTime: 10 minutes (unused data stays in memory for 10m)
 * - retries: 1 retry on failure, but skip for non-recoverable errors (401, 403, 404)
 */
export const reactQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on client errors
        const status = getErrorStatus(error);
        if (status !== null && [401, 403, 404].includes(status)) return false;

        return failureCount < 2;
      },
    },
    mutations: {
      retry: 0,
    },
  },
};
