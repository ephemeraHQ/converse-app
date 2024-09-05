import { QueryClient } from "@tanstack/react-query";
import { experimental_createPersister } from "@tanstack/react-query-persist-client";
import { reactQuerySyncStorage } from "@utils/mmkv";

const GC_TIME = 1000 * 60 * 60 * 24; // 24 hours
const STALE_TIME = 1000 * 60 * 60; // 1 hour

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
      structuralSharing: false,
      // Using a query based persister rather than persisting
      // the whole state on each query change for performance reasons
      persister: experimental_createPersister({
        storage: reactQuerySyncStorage,
        maxAge: GC_TIME,
      }),
    },
  },
});
