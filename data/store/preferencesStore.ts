import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

export type NotificationsPreferences = {
  showNotificationScreen: boolean;
};

export type PreferencesStoreType = {
  notifications: NotificationsPreferences;
  setNotificationsPreferences: (
    notificationsPreferences: Partial<NotificationsPreferences>
  ) => void;
};

export const initPreferencesStore = (account: string) => {
  const profilesStore = create<PreferencesStoreType>()(
    persist(
      (set) => ({
        notifications: {
          showNotificationScreen: true,
        },
        setNotificationsPreferences: (notificationsPreferences) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              ...notificationsPreferences,
            },
          })),
      }),
      {
        name: `store-${account}-preferences`, // Account-based storage so each account can have its own preferences
        storage: createJSONStorage(() => zustandMMKVStorage),
      }
    )
  );
  return profilesStore;
};
