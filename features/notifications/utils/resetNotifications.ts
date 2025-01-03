import { clearNotificationBadgeForAccount } from "./notifications-badge";

export const resetNotifications = async (
  account: string,
  timeout: number = 0
): Promise<void> => {
  setTimeout(async () => {
    if (!account) {
      return;
    }
    clearNotificationBadgeForAccount(account);
  }, timeout);
};
