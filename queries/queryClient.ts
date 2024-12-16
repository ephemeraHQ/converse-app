import { QueryClient } from "@tanstack/react-query";
import { GC_TIME, STALE_TIME } from "./queryClient.constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // libXmtp handles retries
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
      structuralSharing: false,
      // DON'T USE HERE
      // Use a query based persister instead of the whole tree.
      // Using it here seems to break the query client.
      // persister: reactQueryPersister,
    },
  },
});
