import { fetchConversationsQuery } from "@/queries/use-conversations-query";
import { prefetchInboxIdQuery } from "@/queries/inbox-id-query";
import { captureError } from "@/utils/capture-error";
import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { useEffect } from "react";
import { subscribeToNotifications } from "@/features/notifications/utils/subscribeToNotifications";
import { syncConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences";
import { prefetchConversationMetadataQuery } from "@/queries/conversation-metadata-query";
import { Conversation } from "@xmtp/react-native-sdk";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export function HydrationStateHandler() {
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = MultiInboxClient.instance.allEthereumAccountAddresses;

      // todo: create performInitialHydration in MultiInboxClient
      for (const account of accounts) {
        // Don't await because this is for performance but not critical
        prefetchInboxIdQuery({ account }).catch(captureError);
        fetchConversationsQuery({
          account,
          caller: "HydrationStateHandler",
        })
          .then((conversations: Conversation[]) => {
            for (const conversation of conversations) {
              prefetchConversationMetadataQuery(
                account,
                conversation.topic
              ).catch(captureError);
            }
            subscribeToNotifications({
              conversations,
              account,
            });
          })
          .catch(captureError);
        syncConsent(account).catch(captureError);
      }

      useAppStore.getState().setHydrationDone(true);

      logger.debug(
        `[Hydration] Took ${
          (new Date().getTime() - startTime) / 1000
        } seconds total`
      );
    };
    hydrate();
  }, []);

  return null;
}
