import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from "./queryClient.constants";
import { useAccountsStore } from "@/features/multi-inbox/multi-inbox.store";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Used to track which queries execute the queryFn which means will do a network request.
    // Carefull, this is also triggered when the query gets its data from the persister.
    onSuccess: (_, query) => {
      logger.debug(
        `[Query] success fetching ${JSON.stringify(query.queryKey)}${
          query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
        }`
      );
    },
    onError: (error, query) => {
      captureError(
        new Error(
          `Error in query: ${JSON.stringify(query.queryKey)}${
            query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
          }`,
          { cause: error }
        )
      );
    },
  }),

  defaultOptions: {
    queries: {
      // libXmtp handles retries
      retry: false,
      // Prevent infinite refetch loops by manually controlling when queries should retry on component mount
      retryOnMount: false,
      gcTime: DEFAULT_GC_TIME,
      staleTime: DEFAULT_STALE_TIME,
      // Prevent infinite refetch loops by manually controlling when queries should refetch when components mount
      refetchOnMount: false,
      // Prevent infinite refetch loops by manually controlling when queries should refetch when window regains focus
      refetchOnWindowFocus: false,
      // Prevent infinite refetch loops by manually controlling when queries should refetch when network reconnects
      refetchOnReconnect: false,
      structuralSharing: false,
      // DON'T USE HERE
      // Use a query based persister instead of the whole tree.
      // Using it here seems to break the query client.
      // persister: reactQueryPersister,

      // enabled(query) {
      //   const restorationState =
      //     useAccountsStore.getState().multiInboxClientRestorationState;
      //   const currentSender = useAccountsStore.getState().currentSender;
      //   const enabled =
      //     restorationState === "restored" && currentSender !== undefined;
      //   // logger.debug(
      //   //   `[QueryClient] Checking if query ${JSON.stringify(query.queryKey)} is enabled. Restoration state: ${restorationState}, current sender: ${currentSender?.ethereumAddress}`
      //   // );
      //   return enabled;
      // },
    },
  },
});
