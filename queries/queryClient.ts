import { QueryClient } from "@tanstack/react-query";
import { reactQueryPersister } from "@utils/mmkv";

export const GC_TIME = 1000 * 60 * 60 * 24; // 24 hours
const STALE_TIME = 1000 * 60 * 60; // 1 hour

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
      structuralSharing: false,
      // Using a query based persister rather than persisting
      // the whole state on each query change for performance reasons
      persister: reactQueryPersister,
    },
  },
});

// const account = "0x123"
// const topic = "0x123"
// const queryObserver = new QueryObserver(queryClient, { queryKey: [groupConsentQueryKey(account, topic)] })
//
// queryObserver.subscribe(something => {
//   // console.log(something.)
// })

// queryClient.getMutationCache().
// const mutationObserver = new MutationObserver(queryClient, {
//     mutationKey: allowGroupMutationKey(account, topic),
//     mutationFn: async () => {
//       if (!groupId || !account) {
//         return;
//       }
//       await consentToGroupsOnProtocol(account, [groupId], "allow");
//       return "allowed";
//     },
//     onMutate: async () => {
//       await cancelGroupConsentQuery(account, topic);
//       const previousConsent = getGroupConsentQueryData(account, topic);
//       setGroupConsentQueryData(account, topic, "allowed");
//       return { previousConsent };
//     },
//     onError: (error, _variables, context) => {
//       logger.warn("onError useAllowGroupMutation");
//       sentryTrackError(error);
//       if (context?.previousConsent === undefined) {
//         return;
//       }
//       setGroupConsentQueryData(account, topic, context.previousConsent);
//     },
//     onSuccess: () => {
//       logger.debug("onSuccess useAllowGroupMutation");
//     },
//   })

// observer.mutate(allowGroupMutationKey(account, topic))
