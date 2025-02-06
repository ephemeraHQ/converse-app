import mmkv from "@/utils/mmkv";
import { NOTIFICATION_BADGE_MMKV_KEY_PREFIX } from "../notifications-constants";
import notifee from "@notifee/react-native";
import { getAccountsList } from "@/features/multi-inbox/multi-inbox.store";

export const getNotificationBadge = (account: string): number => {
  const key = NOTIFICATION_BADGE_MMKV_KEY_PREFIX + account.toLowerCase();
  if (mmkv.contains(key)) {
    const value = mmkv.getNumber(key);
    return value ?? 0;
  }
  return 0;
};

export const incrementNotificationBadgeForAccount = (
  account: string,
  badge: number
) => {
  notifee.incrementBadgeCount();
  mmkv.set(NOTIFICATION_BADGE_MMKV_KEY_PREFIX + account.toLowerCase(), badge);
};

export const clearNotificationBadgeForAccount = (account: string) => {
  mmkv.delete(NOTIFICATION_BADGE_MMKV_KEY_PREFIX + account.toLowerCase());
  const accounts = getAccountsList();
  let badgeCount = 0;
  for (const account of accounts) {
    const accountCount = getNotificationBadge(account);
    badgeCount += accountCount;
  }
  notifee.setBadgeCount(badgeCount);
};
