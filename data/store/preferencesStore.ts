import { create } from "zustand";

export type NotificationsPreferences = {
  dismissed: boolean;
};

export type PreferencesStoreType = {
  notifications: NotificationsPreferences;
  setNotificationsPreferences: (
    notificationsPreferences: Partial<NotificationsPreferences>
  ) => void;
};

export const initPreferencesStore = () => {
  const profilesStore = create<PreferencesStoreType>()((set) => ({
    notifications: {
      dismissed: false,
    },
    setNotificationsPreferences: (notificationsPreferences) =>
      set((state) => ({
        notifications: { ...state.notifications, ...notificationsPreferences },
      })),
  }));
  return profilesStore;
};
