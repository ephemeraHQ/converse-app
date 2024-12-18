import { prefetchInboxIdQuery } from "@/queries/use-inbox-id-query";
import { fetchPersistedConversationListQuery } from "@/queries/useConversationListQuery";
import logger from "@utils/logger";
import { useEffect } from "react";
import { getAccountsList } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { getInstalledWallets } from "../Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";

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

          const results = await Promise.allSettled([
            getXmtpClient(account),
            fetchPersistedConversationListQuery({ account }),
            prefetchInboxIdQuery({ account }),
          ]);

          const errors = results.filter(
            (result) => result.status === "rejected"
          );
          if (errors.length > 0) {
            logger.warn(`[Hydration] error for ${account}:`, errors);
          }

          const accountEndTime = new Date().getTime();
          logger.debug(
            `[Hydration] Done fetching persisted conversation list for ${account} in ${
              (accountEndTime - accountStartTime) / 1000
            } seconds`
          );
        })
      );

      logger.debug("[Hydration] Done fetching persisted conversation list");

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
