import { useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { cleanupPendingConversations } from "../../data/helpers/conversations/pendingConversations";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccountsList, getUserStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { loadSavedNotificationMessagesToContext } from "../../utils/notifications";
import { getInstalledWallets } from "../Onboarding/supportedWallets";

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      // Let's load installed wallets
      await getInstalledWallets(false);

      const accounts = getAccountsList();
      await Promise.all(accounts.map((a) => initDb(a)));
      Promise.all(accounts.map((a) => cleanupPendingConversations(a)));
      await loadSavedNotificationMessagesToContext();
      await Promise.all(accounts.map((a) => loadDataToContext(a)));

      accounts.map((address) => {
        getUserStore(address).getState().setUserAddress(address);
        refreshProfileForAddress(address, address);
      });

      useAppStore.getState().setHydrationDone(true);
    };
    hydrate();
  }, []);

  return null;
}
