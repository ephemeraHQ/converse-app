import { prefetchInboxIdQuery } from "@/queries/use-inbox-id-query";
import { getAccountsList } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { useEffect } from "react";
import { getInstalledWallets } from "../Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { prefetchConversationsQuery } from "@/queries/conversations-query";

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = getAccountsList();
      if (accounts.length === 0) {
        try {
          // Awaiting before showing onboarding
          await getInstalledWallets(false);
        } catch (e) {
          logger.error("[Hydration] Error getting installed wallets", e);
        }
      } else {
        // note(lustig) I don't think this does anything?
        getInstalledWallets(false);
      }

      // Fetching persisted conversation lists for all accounts
      // We may want to fetch only the selected account's conversation list
      // in the future, but this is simple for now, and want to get feedback to really confirm
      logger.debug(
        "[Hydration] Fetching persisted conversation list for all accounts"
      );

      accounts.map((account) => {
        const accountStartTime = new Date().getTime();
        logger.debug(
          `[Hydration] Fetching persisted conversation list for ${account}`
        );

        prefetchInboxIdQuery({ account });
        prefetchConversationsQuery({ account });

        const accountEndTime = new Date().getTime();
        logger.debug(
          `[Hydration] Done fetching persisted conversation list for ${account} in ${
            (accountEndTime - accountStartTime) / 1000
          } seconds`
        );
      });

      logger.debug(
        "[Hydration] Done prefetching all accounts conversation lists"
      );

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
