import AsyncStorage from "@react-native-async-storage/async-storage";

import { getLocalXmtpClient } from "../components/XmtpState";
import storage from "../utils/mmkv";
import {
  useAccountsStore,
  useChatStore,
  useSettingsStore,
} from "./store/accountsStore";

export const migrateDataIfNeeded = async () => {
  const xmtpClient = await getLocalXmtpClient(undefined, false);
  if (
    xmtpClient &&
    useAccountsStore.getState().currentAccount === "TEMPORARY_ACCOUNT"
  ) {
    // Logged in user, let's save his address as current account
    console.log("Migrating to multi account store - ", xmtpClient.address);
    useAccountsStore.getState().setCurrentAccount(xmtpClient.address);
  }
  const previousSyncedAt = storage.getNumber("lastXMTPSyncedAt") || 0;
  if (previousSyncedAt) {
    console.log("Migrating `lastXMTPSyncedAt` to zustand storage");
    useChatStore.getState().setLastSyncedAt(previousSyncedAt);
    storage.delete("lastXMTPSyncedAt");
  }
  const showNotificationsScreenString = await AsyncStorage.getItem(
    "state.notifications.showNotificationsScreen"
  );
  if (showNotificationsScreenString) {
    const showNotificationScreen = showNotificationsScreenString !== "0";
    console.log("Migrating `showNotificationsScreen` to zustand storage");
    useSettingsStore
      .getState()
      .setNotificationsSettings({ showNotificationScreen });
    await AsyncStorage.removeItem(
      "state.notifications.showNotificationsScreen"
    );
  }
  const connectedToEphemeralAccount = storage.getBoolean(
    "state.app.isEphemeralAccount"
  );
  if (connectedToEphemeralAccount) {
    console.log("Migrating `connectedToEphemeralAccount` to zustand storage");
    useSettingsStore.getState().setEphemeralAccount(true);
    storage.delete("state.app.isEphemeralAccount");
  }

  const initialLoadDoneOnce = storage.getBoolean(
    "state.xmtp.initialLoadDoneOnce"
  );
  if (initialLoadDoneOnce) {
    console.log("Migrating `initialLoadDoneOnce` to zustand storage");
    useChatStore.getState().setInitialLoadDoneOnce();
    storage.delete("state.xmtp.initialLoadDoneOnce");
  }
};
