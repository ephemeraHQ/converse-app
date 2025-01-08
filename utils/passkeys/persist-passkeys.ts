import mmkv from "../mmkv";
import { PASSKEY_INFO_KEY_STORAGE_PREFIX } from "./passkeys.constants";
import { PersistedPasskeyInfo } from "./passkeys.interfaces";

const getPasskeyInfoKey = (userId: string) => {
  return `${PASSKEY_INFO_KEY_STORAGE_PREFIX}-${userId}`;
};

export const savePasskeyInfo = (passkeyInfo: PersistedPasskeyInfo) => {
  const passkeyInfoString = JSON.stringify(passkeyInfo);
  mmkv.set(getPasskeyInfoKey(passkeyInfo.userId), passkeyInfoString);
};

export const loadPasskeyInfo = (userId: string) => {
  const passkeyInfoString = mmkv.getString(getPasskeyInfoKey(userId));
  return passkeyInfoString
    ? (JSON.parse(passkeyInfoString) as PersistedPasskeyInfo)
    : null;
};
