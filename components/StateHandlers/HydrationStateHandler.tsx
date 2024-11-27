import logger from "@utils/logger";
import { useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { cleanupPendingConversations } from "../../data/helpers/conversations/pendingConversations";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccountsList } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { loadSavedNotificationMessagesToContext } from "../../features/notifications/utils/loadSavedNotificationMessagesToContext";
import { getXmtpClient } from "../../utils/xmtpRN/sync";
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
        getInstalledWallets(false);
      }
      await Promise.all(accounts.map((a) => initDb(a)));
      accounts.map((a) => cleanupPendingConversations(a));
      accounts.map((a) => getXmtpClient(a));
      await loadSavedNotificationMessagesToContext();

      await Promise.all(accounts.map((a) => loadDataToContext(a)));

      accounts.map((address) => {
        refreshProfileForAddress(address, address);
      });

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
