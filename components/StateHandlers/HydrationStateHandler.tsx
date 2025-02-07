import { prefetchConversationMetadataQuery } from "@/queries/conversation-metadata-query";
import { fetchAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { captureError } from "@/utils/capture-error";
import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { Conversation } from "@xmtp/react-native-sdk";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useEffect } from "react";
import { useAccountsStore } from "@/features/multi-inbox/multi-inbox.store";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";

export function HydrationStateHandler() {
  const multiInboxClientRestorationState = useAccountsStore(
    (state) => state.multiInboxClientRestorationState
  );
  const isRestored =
    multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.restored;

  useEffect(() => {
    if (!isRestored) {
      return;
    }

    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = MultiInboxClient.instance.allEthereumAccountAddresses;

      // Non critical queries
      for (const account of accounts) {
        fetchAllowedConsentConversationsQuery({
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
          })
          .catch(captureError);
      }

      useAppStore.getState().setHydrationDone(true);

      logger.debug(
        `[Hydration] Took ${
          (new Date().getTime() - startTime) / 1000
        } seconds total`
      );
    };

    hydrate();
  }, [isRestored]);

  return null;
}
