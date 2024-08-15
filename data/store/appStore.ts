import { Platform } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// A app-wide store to store settings that don't depend on
// an account like if notifications are accepted

type AppStoreType = {
  notificationsPermissionStatus: "undetermined" | "granted" | "denied";
  setNotificationsPermissionStatus: (
    status: AppStoreType["notificationsPermissionStatus"]
  ) => void;

  addressBookPermissionStatus: "undetermined" | "granted" | "denied";
  setAddressBookPermissionStatus: (
    status: AppStoreType["addressBookPermissionStatus"]
  ) => void;

  splashScreenHidden: boolean;
  setSplashScreenHidden: (hidden: boolean) => void;

  isInternetReachable: boolean;
  setIsInternetReachable: (reachable: boolean) => void;

  hydrationDone: boolean;
  setHydrationDone: (done: boolean) => void;

  lastVersionOpen: string;
  setLastVersionOpen: (version: string) => void;

  actionSheetShown: boolean;
  setActionSheetShown: (s: boolean) => void;

  contextMenuShownId: string | null;
  setContextMenuShown: (messageId: string | null) => void;
};

export const useAppStore = create<AppStoreType>()(
  persist(
    (set) => ({
      notificationsPermissionStatus: "undetermined",
      setNotificationsPermissionStatus: (status) =>
        set(() => ({
          notificationsPermissionStatus: status,
        })),

      addressBookPermissionStatus: "undetermined",
      setAddressBookPermissionStatus: (status) =>
        set(() => ({
          addressBookPermissionStatus: status,
        })),

      // On web no splash screen at all
      splashScreenHidden: Platform.OS === "web",
      setSplashScreenHidden: (hidden) =>
        set(() => ({ splashScreenHidden: hidden })),

      isInternetReachable: false,
      setIsInternetReachable: (reachable) =>
        set(() => ({ isInternetReachable: reachable })),

      // No hydration on web
      hydrationDone: Platform.OS === "web",
      setHydrationDone: (done) => set(() => ({ hydrationDone: done })),

      lastVersionOpen: "",
      setLastVersionOpen: (version) =>
        set(() => ({ lastVersionOpen: version })),

      actionSheetShown: false,
      setActionSheetShown: (s: boolean) => set(() => ({ actionSheetShown: s })),

      contextMenuShownId: null,
      setContextMenuShown: (messageId: string | null) =>
        set(() => ({ contextMenuShownId: messageId })),
    }),
    {
      name: "store-app",
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        lastVersionOpen: state.lastVersionOpen,
        addressBookPermissionStatus: state.addressBookPermissionStatus,
      }),
    }
  )
);
