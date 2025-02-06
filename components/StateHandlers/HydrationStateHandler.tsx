import { subscribeToNotifications } from "@/features/notifications/utils/subscribeToNotifications";
import { prefetchConversationMetadataQuery } from "@/queries/conversation-metadata-query";
import { fetchAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { ensureInboxId } from "@/queries/inbox-id-query";
import { captureError } from "@/utils/capture-error";

import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { Conversation } from "@xmtp/react-native-sdk";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useEffect } from "react";
import { useAccountsStore } from "@/features/multi-inbox/multi-inbox.store";

export function HydrationStateHandler() {
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = MultiInboxClient.instance.allEthereumAccountAddresses;

      // todo: create performInitialHydration in MultiInboxClient
      // Critical queries
      const results = await Promise.allSettled(
        // We need the inboxId for each account since we use them so much
        accounts.map((account) => ensureInboxId({ account }))
      );

      // Remove accounts that failed to get an inboxId
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const failedAccount = accounts[index];
          // note(lustig) Thierry added this but I'm unsure how it'd ever happen
          captureError({
            ...result.reason,
            message: `[Hydration] Failed to get inboxId for account ${failedAccount}, removing account. ${result.reason.message}`,
          });
          useAccountsStore.getState().removeAccount(failedAccount);
        }
      });

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
            subscribeToNotifications({
              conversations,
              account,
            });
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
  }, []);

  return null;
}
