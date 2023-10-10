import { useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { cleanupPendingConversations } from "../../data/helpers/conversations/pendingConversations";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccountsList } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { loadSavedNotificationMessagesToContext } from "../../utils/notifications";
import { getInstalledWallets } from "../Onboarding/supportedWallets";

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      let lastTime = startTime;
      // Let's load installed wallets
      await getInstalledWallets(false);

      const accounts = getAccountsList();
      await Promise.all(accounts.map((a) => initDb(a)));
      console.log(
        `[Hydration] Db init took ${
          (new Date().getTime() - lastTime) / 1000
        } seconds`
      );
      accounts.map((a) => cleanupPendingConversations(a));
      lastTime = new Date().getTime();
      await loadSavedNotificationMessagesToContext();
      console.log(
        `[Hydration] Loading notification data took ${
          (new Date().getTime() - lastTime) / 1000
        } seconds`
      );
      lastTime = new Date().getTime();
      await Promise.all(accounts.map((a) => loadDataToContext(a)));
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
