import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Preferences for each account setup in the app
// not all of them are really preferences selected
// by users (i.e. ephemeralAccount is setup when user logs)

export type NotificationsPreferences = {
  showNotificationScreen: boolean;
};

export type PreferencesStoreType = {
  notifications: NotificationsPreferences;
  setNotificationsPreferences: (
    notificationsPreferences: Partial<NotificationsPreferences>
  ) => void;
  ephemeralAccount: boolean;
  setEphemeralAccount: (ephemeral: boolean) => void;
};

export const initPreferencesStore = (account: string) => {
  const profilesStore = create<PreferencesStoreType>()(
    persist(
      (set) => ({
        notifications: {
          showNotificationScreen: true,
        },
        ephemeralAccount: false,
        setNotificationsPreferences: (notificationsPreferences) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              ...notificationsPreferences,
            },
          })),
        setEphemeralAccount: (ephemeral) =>
          set(() => ({
            ephemeralAccount: ephemeral,
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
