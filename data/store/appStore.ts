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

  splashScreenHidden: boolean;
  setSplashScreenHidden: (hidden: boolean) => void;

  isInternetReachable: boolean;
  setIsInternetReachable: (reachable: boolean) => void;

  hydrationDone: boolean;
  setHydrationDone: (done: boolean) => void;

  mediaPreview: {
    sending: boolean;
    mediaURI: string;
    error: boolean;
  } | null;
  setMediaPreview: (
    preview: {
      sending: boolean;
      mediaURI: string;
      error: boolean;
    } | null
  ) => void;

  lastVersionOpen: string;
  setLastVersionOpen: (version: string) => void;
};

export const useAppStore = create<AppStoreType>()(
  persist(
    (set) => ({
      notificationsPermissionStatus: "undetermined",
      setNotificationsPermissionStatus: (status) =>
        set(() => ({
          notificationsPermissionStatus: status,
        })),

      splashScreenHidden: false,
      setSplashScreenHidden: (hidden) =>
        set(() => ({ splashScreenHidden: hidden })),

      isInternetReachable: false,
      setIsInternetReachable: (reachable) =>
        set(() => ({ isInternetReachable: reachable })),

      hydrationDone: false,
      setHydrationDone: (done) => set(() => ({ hydrationDone: done })),

      mediaPreview: null,
      setMediaPreview: (preview) => set(() => ({ mediaPreview: preview })),

      lastVersionOpen: "",
      setLastVersionOpen: (version) =>
        set(() => ({ lastVersionOpen: version })),
    }),
    {
      name: "store-app",
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        lastVersionOpen: state.lastVersionOpen,
      }),
    }
  )
);
