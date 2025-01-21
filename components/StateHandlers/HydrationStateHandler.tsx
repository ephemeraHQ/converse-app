import { fetchConversationsQuery } from "@/queries/use-conversations-query";
import { prefetchInboxIdQuery } from "@/queries/use-inbox-id-query";
import { captureError } from "@/utils/capture-error";
import { getAccountsList } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import logger from "@utils/logger";
import { useEffect } from "react";
import { getInstalledWallets } from "../Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { subscribeToNotifications } from "@/features/notifications/utils/subscribeToNotifications";
import { syncConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences";

export default function HydrationStateHandler() {
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

      for (const account of accounts) {
        // Don't await because this is for performance but not critical
        prefetchInboxIdQuery({ account }).catch(captureError);
        fetchConversationsQuery({
          account,
          caller: "HydrationStateHandler",
        })
          .then((conversations) => {
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
