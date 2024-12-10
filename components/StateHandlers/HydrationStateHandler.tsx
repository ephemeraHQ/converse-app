import logger from "@utils/logger";
import { useEffect } from "react";
import { getAccountsList } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { getXmtpClient } from "../../utils/xmtpRN/sync";
import { getInstalledWallets } from "../Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { fetchPersistedConversationListQuery } from "@/queries/useV3ConversationListQuery";
import { prefetchCurrentUserAccountInboxId } from "@/features/conversation/conversation-message/conversation-message.utils";

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = getAccountsList();
      if (accounts.length === 0) {
        // Awaiting before showing onboarding
        await getInstalledWallets(false);
      } else {
        // note(lustig) I don't think this does anything?
        getInstalledWallets(false);
      }

      // Fetching persisted conversation lists for all accounts
      // We may want to fetch only the selected account's conversation list
      // in the future, but this is simple for now, and want to get feedback to really confirm
      logger.debug("[Hydration] Fetching persisted conversation list");
      await Promise.allSettled(
        accounts.map(async (account) => {
          const accountStartTime = new Date().getTime();
          logger.debug(
            `[Hydration] Fetching persisted conversation list for ${account}`
          );
          await getXmtpClient(account);
          await fetchPersistedConversationListQuery(account);
          const accountEndTime = new Date().getTime();
          logger.debug(
            `[Hydration] Done fetching persisted conversation list for ${account} in ${
              (accountEndTime - accountStartTime) / 1000
            } seconds`
          );
        })
      );

      logger.debug("[Hydration] Done fetching persisted conversation list");

      // TODO: Move else where once we refactored the accounts logics
      await prefetchCurrentUserAccountInboxId();

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
