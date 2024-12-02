import mmkv from "@/utils/mmkv";

const getShownNotificationIds = (): string[] => {
  const jsonData = mmkv.getString("notification-ids");
  if (jsonData) {
    try {
      return JSON.parse(jsonData) as string[];
    } catch {
      return [];
    }
  }
  return [];
};

const setShownNotificationIds = (ids: string[]): void => {
  try {
    const jsonData = JSON.stringify(ids);
    mmkv.set("notification-ids", jsonData);
  } catch {
    // Handle error silently
  }
};

const MAX_STORED_IDS = 10;
export const notificationAlreadyShown = (messageId?: string): boolean => {
  // Check if the messageId is not undefined/null and not an empty string
  if (!messageId?.trim()) {
    return true;
  }

  // If the id already exists in the list, don't show the notification
  const existingIds = getShownNotificationIds();
  if (existingIds.includes(messageId)) {
    return true;
  }

  // Append the new id to the list
  const updatedIds = [...existingIds, messageId];

  // If the list exceeds the maximum limit, trim from the beginning
  if (updatedIds.length > MAX_STORED_IDS) {
    updatedIds.splice(0, updatedIds.length - MAX_STORED_IDS);
  }

  // Store the updated list of IDs back to storage
  setShownNotificationIds(updatedIds);

  // If all conditions are met, show the notification
  return false;
};
