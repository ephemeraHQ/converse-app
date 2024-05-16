import { useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { cleanupPendingConversations } from "../../data/helpers/conversations/pendingConversations";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccountsList } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { debugTimeSpent } from "../../utils/debug";
import { loadSavedNotificationMessagesToContext } from "../../utils/notifications";
import { getXmtpClient } from "../../utils/xmtpRN/sync";
import { getInstalledWallets } from "../Onboarding/supportedWallets";

debugTimeSpent({ id: "OPTIM" });

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      debugTimeSpent({ id: "OPTIM", actionToLog: "Hydration started" });
      const startTime = new Date().getTime();
      let lastTime = startTime;
      const accounts = getAccountsList();
      if (accounts.length === 0) {
        // Awaiting before showing onboarding
        await getInstalledWallets(false);
      } else {
        getInstalledWallets(false);
      }
      debugTimeSpent({ id: "OPTIM", actionToLog: "Wallets loaded" });
      await Promise.all(accounts.map((a) => initDb(a)));
      debugTimeSpent({ id: "OPTIM", actionToLog: "Dbs initialized" });
      console.log(
        `[Hydration] Db init took ${
          (new Date().getTime() - lastTime) / 1000
        } seconds`
      );
      accounts.map((a) => cleanupPendingConversations(a));
      accounts.map((a) => getXmtpClient(a));
      lastTime = new Date().getTime();
      await loadSavedNotificationMessagesToContext();
      debugTimeSpent({ id: "OPTIM", actionToLog: "Notifications imported" });
      console.log(
        `[Hydration] Loading notification data took ${
          (new Date().getTime() - lastTime) / 1000
        } seconds`
      );
      lastTime = new Date().getTime();
      await Promise.all(accounts.map((a) => loadDataToContext(a)));
      debugTimeSpent({
        id: "OPTIM",
        actionToLog: "Imported local data to context",
      });
      console.log(
        `[Hydration] Loading data to context took ${
          (new Date().getTime() - lastTime) / 1000
        } seconds`
      );
      accounts.map((address) => {
        refreshProfileForAddress(address, address);
      });

      useAppStore.getState().setHydrationDone(true);
      console.log(
        `[Hydration] Took ${
          (new Date().getTime() - startTime) / 1000
        } seconds total`
      );
    };
    hydrate();
  }, []);

  return null;
}
