import AsyncStorage from "@react-native-async-storage/async-storage";

import mmkv from "../../utils/mmkv";

export const prepareForRefacto = () => {
  console.log("Preparing data for refacto (asyncstorage)");
  const lastXMTPSyncedAt = mmkv.getNumber("lastXMTPSyncedAt") || 0;
  AsyncStorage.setItem("lastXMTPSyncedAt", `${lastXMTPSyncedAt}`);

  const isEphemeral = mmkv.getBoolean("state.app.isEphemeralAccount");
  if (isEphemeral) {
    AsyncStorage.setItem("state.app.isEphemeralAccount", "true");
  }
  const initialLoadDoneOnce = mmkv.getBoolean("state.xmtp.initialLoadDoneOnce");
  if (initialLoadDoneOnce) {
    AsyncStorage.setItem("state.xmtp.initialLoadDoneOnce", "true");
  }
};
