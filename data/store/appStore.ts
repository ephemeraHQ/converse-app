import { create } from "zustand";

// A app-wide store to store settings that don't depend on
// an account like if notifications are accepted

type AppStoreType = {
  notificationsPermissionStatus: "undetermined" | "granted" | "denied";
  setNotificationsPermissionStatus: (
    status: AppStoreType["notificationsPermissionStatus"]
  ) => void;
};

export const useAppStore = create<AppStoreType>()((set) => ({
  notificationsPermissionStatus: "undetermined",
  setNotificationsPermissionStatus: (status) =>
    set(() => ({
      notificationsPermissionStatus: status,
    })),
}));
