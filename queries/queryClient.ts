import { QueryClient } from "@tanstack/react-query";
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from "./queryClient.constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // libXmtp handles retries
      retryOnMount: false, // Prevent infinite refetch loops by manually controlling when queries should retry on component mount
      gcTime: DEFAULT_GC_TIME,
      staleTime: DEFAULT_STALE_TIME,
      refetchOnMount: false, // Prevent infinite refetch loops by manually controlling when queries should refetch when components mount
      refetchOnWindowFocus: false, // Prevent infinite refetch loops by manually controlling when queries should refetch when window regains focus
      refetchOnReconnect: false, // Prevent infinite refetch loops by manually controlling when queries should refetch when network reconnects
      structuralSharing: false,
      // DON'T USE HERE
      // Use a query based persister instead of the whole tree.
      // Using it here seems to break the query client.
      // persister: reactQueryPersister,
    },
  },
});
