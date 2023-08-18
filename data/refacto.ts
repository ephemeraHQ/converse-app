import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

import { getLocalXmtpClient } from "../components/XmtpState";
import storage from "../utils/mmkv";
import {
  useAccountsStore,
  useChatStore,
  useSettingsStore,
} from "./store/accountsStore";

export const migrateDataIfNeeded = async () => {
  const before = new Date().getTime();
  let currentAccount = useAccountsStore.getState().currentAccount;
  if (currentAccount === "TEMPORARY_ACCOUNT") {
    const xmtpClient = await getLocalXmtpClient(undefined, false);
    if (xmtpClient) {
      currentAccount = xmtpClient.address;
      console.log("Migrating to multi account store - ", xmtpClient.address);
      useAccountsStore.getState().setCurrentAccount(xmtpClient.address);
    }
  }
  const dbPath = `${RNFS.DocumentDirectoryPath}/SQLite/converse`;
  const dbExists = await RNFS.exists(dbPath);
  if (currentAccount !== "TEMPORARY_ACCOUNT" && dbExists) {
    const newDbPath = `${RNFS.DocumentDirectoryPath}/SQLite/converse-${currentAccount}.sqlite`;
    console.log(
      "Moving the database to a dedicated account database",
      newDbPath
    );
    await RNFS.moveFile(dbPath, newDbPath);
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
  const after = new Date().getTime();
  console.log(`[Refacto] Migration took ${(after - before) / 1000} seconds`);
};
