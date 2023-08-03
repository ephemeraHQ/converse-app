import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Settings for each account setup in the app
// not all of them are really settings selected
// by users (i.e. ephemeralAccount is setup when user logs)

export type NotificationsSettings = {
  showNotificationScreen: boolean;
};

export type UserSettings = {
  address: string;
};

export type SettingsStoreType = {
  notifications: NotificationsSettings;
  setNotificationsSettings: (
    notificationsSettings: Partial<NotificationsSettings>
  ) => void;
  ephemeralAccount: boolean;
  setEphemeralAccount: (ephemeral: boolean) => void;
};

export const initSettingsStore = (account: string) => {
  const profilesStore = create<SettingsStoreType>()(
    persist(
      (set) => ({
        notifications: {
          showNotificationScreen: true,
        },
        ephemeralAccount: false,
        setNotificationsSettings: (notificationsSettings) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              ...notificationsSettings,
            },
          })),
        setEphemeralAccount: (ephemeral) =>
          set(() => ({
            ephemeralAccount: ephemeral,
          })),
      }),
      {
        name: `store-${account}-settings`, // Account-based storage so each account can have its own settings
        storage: createJSONStorage(() => zustandMMKVStorage),
      }
    )
  );
  return profilesStore;
};
