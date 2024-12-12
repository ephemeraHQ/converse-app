import { QueryClient } from "@tanstack/react-query";
import { reactQueryPersister } from "@utils/mmkv";
import { GC_TIME, STALE_TIME } from "./queryClient.constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // libXmtp handles retries
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
      structuralSharing: false,
      // Using a query based persister rather than persisting
      // the whole state on each query change for performance reasons
      persister: reactQueryPersister,
    },
  },
});
