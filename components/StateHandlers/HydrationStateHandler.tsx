import { useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccounts, useUserStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { cleanupAfterLogout } from "../../utils/logout";
import mmkv from "../../utils/mmkv";
import { loadSavedNotificationMessagesToContext } from "../../utils/notifications";
import { pick } from "../../utils/objects";
import { getInstalledWallets } from "../Onboarding/supportedWallets";
import { getLocalXmtpClient } from "../XmtpState";
import { prepareForRefacto } from "./prepareForRefacto";

export default function HydrationStateHandler() {
  const setUserAddress = useUserStore((s) => s.setUserAddress);
  const { setHydrationDone } = useAppStore((s) =>
    pick(s, ["setHydrationDone"])
  );

  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      const didJustLogout = mmkv.getBoolean("converse-logout");
      if (didJustLogout) {
        console.log("Cleaning up after a logout");
        await cleanupAfterLogout();
      }
      // Let's load installed wallets
      await getInstalledWallets(false);

      const accounts = getAccounts();
      await Promise.all(accounts.map((a) => initDb(a)));

      await loadSavedNotificationMessagesToContext();
      await Promise.all(accounts.map((a) => loadDataToContext(a)));

      let address: string | null = null;

      const xmtpClient = await getLocalXmtpClient();
      if (xmtpClient) {
        address = xmtpClient.address;
        setUserAddress(xmtpClient.address);
      }

      if (address) {
        accounts.map((a) => refreshProfileForAddress(a, address as string));
      }

      setHydrationDone(true);
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
