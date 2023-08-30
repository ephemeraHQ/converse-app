import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import RNFS from "react-native-fs";

import { saveXmtpKey, secureStoreOptions } from "../utils/keychain";
import storage from "../utils/mmkv";
import { sentryTrackMessage } from "../utils/sentry";
import { getXmtpClientFromBase64Key } from "../utils/xmtp/client";
import { getDbPath } from "./db";
import {
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
  useChatStore,
  useSettingsStore,
} from "./store/accountsStore";

export const migrateDataIfNeeded = async () => {
  const before = new Date().getTime();
  let currentAccount = useAccountsStore.getState().currentAccount;
  if (currentAccount === TEMPORARY_ACCOUNT_NAME) {
    const xmtpKey = await SecureStore.getItemAsync(
      "XMTP_KEYS",
      secureStoreOptions
    );
    if (xmtpKey) {
      const base64Key = Buffer.from(JSON.parse(xmtpKey)).toString("base64");
      const xmtpClient = await getXmtpClientFromBase64Key(base64Key);
      if (xmtpClient) {
        currentAccount = xmtpClient.address;
        console.log("Migrating to multi account store - ", xmtpClient.address);
        useAccountsStore.getState().setCurrentAccount(xmtpClient.address);
      }
    }
  }

  if (currentAccount !== TEMPORARY_ACCOUNT_NAME) {
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
  if (currentAccount !== TEMPORARY_ACCOUNT_NAME) {
    const xmtpKey = await SecureStore.getItemAsync(
      "XMTP_KEYS",
      secureStoreOptions
    );
    if (xmtpKey) {
      console.log(
        `[Refacto] Migrating the XMTP secure Key to an account based key`
      );
      const base64Key = Buffer.from(JSON.parse(xmtpKey)).toString("base64");
      await saveXmtpKey(currentAccount, base64Key);
      await SecureStore.deleteItemAsync("XMTP_KEYS", secureStoreOptions);
      await SecureStore.deleteItemAsync("XMTP_BASE64_KEY", secureStoreOptions);
    }
  }

  const after = new Date().getTime();
  console.log(`[Refacto] Migration took ${(after - before) / 1000} seconds`);
};
