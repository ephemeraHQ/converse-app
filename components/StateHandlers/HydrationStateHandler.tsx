import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect } from "react";

import { loadDataToContext } from "../../data";
import { initDb } from "../../data/db";
import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { NotificationsDispatchTypes } from "../../data/store/notificationsReducer";
import { XmtpDispatchTypes } from "../../data/store/xmtpReducer";
import { loadSavedNotificationMessagesToContext } from "../../utils/backgroundNotifications/loadSavedNotifications";
import mmkv from "../../utils/mmkv";
import { getLoggedXmtpAddress } from "../../utils/sharedData/sharedData";
import { addLog } from "../DebugButton";
import { getLocalXmtpClient } from "../XmtpState";

export default function HydrationStateHandler() {
  const { dispatch } = useContext(AppContext);

  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      // Let's rehydrate value before hiding splash
      const showNotificationsScreen = await AsyncStorage.getItem(
        "state.notifications.showNotificationsScreen"
      );
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
      if (showNotificationsScreen) {
        dispatch({
          type: NotificationsDispatchTypes.NotificationsShowScreen,
          payload: {
            show: showNotificationsScreen !== "0",
          },
        });
      }

      if (xmtpAddress) {
        dispatch({
          type: XmtpDispatchTypes.XmtpSetAddress,
          payload: {
            address: xmtpAddress,
          },
        });
      } else {
        const xmtpClient = await getLocalXmtpClient();
        if (xmtpClient) {
          dispatch({
            type: XmtpDispatchTypes.XmtpSetAddress,
            payload: {
              address: xmtpClient.address,
            },
          });
        }
      }

      const savedBlockedPeers = JSON.parse(
        mmkv.getString("state.xmtp.blockedPeerAddresses") || "{}"
      );
      const initialLoadDoneOnce = mmkv.getBoolean(
        "state.xmtp.initialLoadDoneOnce"
      );
      if (initialLoadDoneOnce) {
        dispatch({
          type: XmtpDispatchTypes.XmtpInitialLoadDoneOnce,
        });
      }
      dispatch({
        type: XmtpDispatchTypes.XmtpSetBlockedPeerAddresses,
        payload: { blockedPeerAddresses: savedBlockedPeers },
      });

      dispatch({
        type: AppDispatchTypes.AppSetHydrationDone,
        payload: { done: true },
      });
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
