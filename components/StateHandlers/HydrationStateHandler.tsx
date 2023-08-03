import { useContext, useEffect } from "react";
import { Alert } from "react-native";

import { loadDataToContext, refreshProfileForAddress } from "../../data";
import { initDb } from "../../data/db";
import { AppContext } from "../../data/deprecatedStore/context";
import { XmtpDispatchTypes } from "../../data/deprecatedStore/xmtpReducer";
import { useUserStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { loadSavedNotificationMessagesToContext } from "../../utils/backgroundNotifications/loadSavedNotifications";
import { loadXmtpKeys } from "../../utils/keychain";
import { cleanupAfterLogout, logout } from "../../utils/logout";
import mmkv from "../../utils/mmkv";
import { pick } from "../../utils/objects";
import { getLoggedXmtpAddress } from "../../utils/sharedData/sharedData";
import { addLog } from "../DebugButton";
import { getInstalledWallets } from "../Onboarding/supportedWallets";
import { getLocalXmtpClient } from "../XmtpState";
import { prepareForRefacto } from "./prepareForRefacto";

let migrationAlertShown = false;

export default function HydrationStateHandler() {
  const { state, dispatch } = useContext(AppContext);
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
      await loadDataToContext(dispatch);

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

      const initialLoadDoneOnce = mmkv.getBoolean(
        "state.xmtp.initialLoadDoneOnce"
      );
      if (initialLoadDoneOnce) {
        dispatch({
          type: XmtpDispatchTypes.XmtpInitialLoadDoneOnce,
        });
      }

      setHydrationDone(true);
      if (xmtpAddress && !migrationAlertShown) {
        const xmtpKeys = await loadXmtpKeys();
        if (!xmtpKeys) {
          // We thought we would be logged in but
          // due to app transfer we lost access to
          // keychain, let's log user out and alert
          migrationAlertShown = true;
          logout(state, dispatch);
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
