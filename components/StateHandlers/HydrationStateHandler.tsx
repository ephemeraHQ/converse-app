import { prefetchConversationMetadataQuery } from "@/queries/conversation-metadata-query";
import { fetchAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { ensureInboxId } from "@/queries/inbox-id-query";
import { captureError } from "@/utils/capture-error";
import { HydrationError } from "@/utils/error";
import { getAccountsList, useAccountsStore } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { Conversation } from "@xmtp/react-native-sdk";
import { useEffect } from "react";

export default function HydrationStateHandler() {
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = getAccountsList();

      // Critical queries
      try {
        await Promise.all(
          // We need the inboxId for each account since we use them so much
          accounts.map(async (account): Promise<void> => {
            try {
              await ensureInboxId({ account });
            } catch (error) {
              captureError(
                new HydrationError(
                  `Failed to get inboxId for account ${account}, removing account`,
                  error
                )
              );
              useAccountsStore.getState().removeAccount(account);
            }
          })
        );
      } catch (error) {
        captureError(error);
      }

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
  }, []);

  return null;
}
