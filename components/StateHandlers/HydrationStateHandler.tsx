import { useEffect } from "react";
import { Alert } from "react-native";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { useUserStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { loadXmtpKeys } from "../../utils/keychain";
import { cleanupAfterLogout, logout } from "../../utils/logout";
import mmkv from "../../utils/mmkv";
import { loadSavedNotificationMessagesToContext } from "../../utils/notifications";
import { pick } from "../../utils/objects";
import { getLoggedXmtpAddress } from "../../utils/sharedData/sharedData";
import { addLog } from "../DebugButton";
import { getInstalledWallets } from "../Onboarding/supportedWallets";
import { getLocalXmtpClient } from "../XmtpState";
import { prepareForRefacto } from "./prepareForRefacto";

let migrationAlertShown = false;

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
      let xmtpAddress = null;
      try {
        xmtpAddress = await getLoggedXmtpAddress();
      } catch {
        console.log("Error: failed to load saved logged XMTP Address");
        addLog("Error: failed to load saved logged XMTP Address");
      }
      await initDb();

      await loadSavedNotificationMessagesToContext();
      await loadDataToContext();

      let address = xmtpAddress;

      if (xmtpAddress) {
        setUserAddress(xmtpAddress);
      } else {
        const xmtpClient = await getLocalXmtpClient();
        if (xmtpClient) {
          address = xmtpClient.address;
          setUserAddress(xmtpClient.address);
        }
      }

      if (address) {
        refreshProfileForAddress(address);
      }

      setHydrationDone(true);
      if (xmtpAddress && !migrationAlertShown) {
        const xmtpKeys = await loadXmtpKeys();
        if (!xmtpKeys) {
          // We thought we would be logged in but
          // due to app transfer we lost access to
          // keychain, let's log user out and alert
          migrationAlertShown = true;
          logout();
          Alert.alert(
            "🙏 Log in again",
            "hey ! Due to a technical migration, we had to log you out. We know it sucks and we're sorry about it, won't happen again anytime soon. Login again and enjoy Converse!"
          );
        }
      }
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
