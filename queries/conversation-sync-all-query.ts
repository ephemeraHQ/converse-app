import { conversationSyncAllQueryKey } from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { captureError } from "@/utils/capture-error";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { queryOptions } from "@tanstack/react-query";
import { ConsentState } from "@xmtp/react-native-sdk";

type IArgs = {
  ethAddress: string;
  consentStates: ConsentState[];
};

export function getConversationSyncAllQueryOptions(args: IArgs) {
  return queryOptions({
    queryKey: conversationSyncAllQueryKey(args),
    queryFn: async () => {
      if (!args.ethAddress) {
        throw new Error("ethAddress is required");
      }

      if (!args.consentStates.length) {
        throw new Error("consentStates is required");
      }

      const client = await getXmtpClient({
        address: args.ethAddress,
      });

      const beforeSync = new Date().getTime();
      await client.conversations.syncAllConversations(args.consentStates);
      const afterSync = new Date().getTime();

      const timeDiff = afterSync - beforeSync;
      if (timeDiff > 3000) {
        captureError(
          new Error(
            `[getConversationSyncAllQuery] Syncing conversations from network took ${timeDiff}ms for account ${args.ethAddress}`
          )
        );
      }

      return true;
    },
    staleTime: 5000, // 5 seconds seems okay for now to not overload the network
    enabled: !!args.ethAddress && !!args.consentStates.length,
  });
}

export function ensureConversationSyncAllQuery(args: IArgs) {
  return queryClient.ensureQueryData(getConversationSyncAllQueryOptions(args));
}
