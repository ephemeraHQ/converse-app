import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

import { getLocalXmtpClient } from "../components/XmtpState";
import storage from "../utils/mmkv";
import { sentryTrackMessage } from "../utils/sentry";
import { getDbPath } from "./db";
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

  if (currentAccount !== "TEMPORARY_ACCOUNT") {
    const dbPath = `${RNFS.DocumentDirectoryPath}/SQLite/converse`;
    const dbExists = await RNFS.exists(dbPath);
    if (dbExists) {
      const newDbPath = await getDbPath(currentAccount);
      console.log(
        "Moving the database to a dedicated account database",
        newDbPath
      );
      try {
        await RNFS.moveFile(dbPath, newDbPath);
      } catch (e) {
        console.log("COULD NOT MOVE DB", e);
        sentryTrackMessage("COULD_NOT_MOVE_DB", { error: JSON.stringify(e) });
      }
    }
  }
  const previousSyncedAtMMKV = storage.getNumber("lastXMTPSyncedAt") || 0;
  const previousSyncedAtAsyncStorage = await AsyncStorage.getItem(
    "lastXMTPSyncedAt"
  );
  let previousSyncedAt = 0;
  if (previousSyncedAtAsyncStorage) {
    console.log(
      "Got `lastXMTPSyncedAt` from Async Storage:",
      previousSyncedAtAsyncStorage
    );
    previousSyncedAt = parseInt(previousSyncedAtAsyncStorage, 10);
  } else if (previousSyncedAtMMKV) {
    console.log("Got `lastXMTPSyncedAt` from MMKV:", previousSyncedAtMMKV);
    previousSyncedAt = previousSyncedAtMMKV;
  }
  if (previousSyncedAt) {
    console.log("Migrating `lastXMTPSyncedAt` to zustand storage");
    useChatStore.getState().setLastSyncedAt(previousSyncedAt);
  }
  AsyncStorage.removeItem("lastXMTPSyncedAt");
  storage.delete("lastXMTPSyncedAt");
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
  let connectedToEphemeralAccount = false;
  const connectedToEphemeralAccountMMKV = storage.getBoolean(
    "state.app.isEphemeralAccount"
  );
  const connectedToEphemeralAccountAsyncStorage = await AsyncStorage.getItem(
    "state.app.isEphemeralAccount"
  );
  if (connectedToEphemeralAccountAsyncStorage) {
    console.log(
      "Got `isEphemeralAccount` from Async Storage:",
      connectedToEphemeralAccountAsyncStorage
    );
    connectedToEphemeralAccount =
      connectedToEphemeralAccountAsyncStorage === "true";
  } else if (connectedToEphemeralAccountMMKV) {
    console.log(
      "Got `isEphemeralAccount` from MMKV:",
      connectedToEphemeralAccountMMKV
    );
    connectedToEphemeralAccount = connectedToEphemeralAccountMMKV;
  }
  if (connectedToEphemeralAccount) {
    console.log("Migrating `connectedToEphemeralAccount` to zustand storage");
    useSettingsStore.getState().setEphemeralAccount(true);
  }
  AsyncStorage.removeItem("state.app.isEphemeralAccount");
  storage.delete("state.app.isEphemeralAccount");

  let initialLoadDoneOnce = false;
  const initialLoadDoneOnceMMKV = storage.getBoolean(
    "state.xmtp.initialLoadDoneOnce"
  );
  const initialLoadDoneOnceMMKVAsyncStorage = await AsyncStorage.getItem(
    "state.xmtp.initialLoadDoneOnce"
  );
  if (initialLoadDoneOnceMMKVAsyncStorage) {
    console.log(
      "Got `initialLoadDoneOnce` from Async Storage:",
      initialLoadDoneOnceMMKVAsyncStorage
    );
    initialLoadDoneOnce = initialLoadDoneOnceMMKVAsyncStorage === "true";
  } else if (initialLoadDoneOnceMMKV) {
    console.log(
      "Got `initialLoadDoneOnce` from MMKV:",
      initialLoadDoneOnceMMKV
    );
    initialLoadDoneOnce = initialLoadDoneOnceMMKV;
  }
  if (initialLoadDoneOnce) {
    console.log("Migrating `initialLoadDoneOnce` to zustand storage");
    useChatStore.getState().setInitialLoadDoneOnce();
  }
  AsyncStorage.removeItem("state.xmtp.initialLoadDoneOnce");
  storage.delete("state.xmtp.initialLoadDoneOnce");

  // Let's migrate keys if needed
  if (currentAccount !== "TEMPORARY_ACCOUNT") {
  }

  const after = new Date().getTime();
  console.log(`[Refacto] Migration took ${(after - before) / 1000} seconds`);
};
