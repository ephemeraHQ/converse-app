import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import logger from "@/utils/logger";

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
  setSplashScreenHidden: (hidden: true) => void;

  isInternetReachable: boolean;
  setIsInternetReachable: (reachable: boolean) => void;

  hydrationDone: boolean;
  setHydrationDone: (done: true) => void;

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
      splashScreenHidden: false,
      setSplashScreenHidden: (hidden) =>
        set(() => ({ splashScreenHidden: hidden })),

      isInternetReachable: false,
      setIsInternetReachable: (reachable) =>
        set(() => ({ isInternetReachable: reachable })),

      // No hydration on web
      hydrationDone: false,
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

/**
 * Utility function to wait for the app store to be hydrated.
 * This can be used, for example, to ensure that the xmtp clients have been instantiated and the
 * conversation list is fetched before navigating to a conversation.
 *
 * @param timeout - The maximum time to wait for hydration in milliseconds. Defaults to 1000ms (1 second).
 *
 * As of December 19, 2024, when we say XMTP client hydration, we mean that the following are true:
 * 1) XMTP client for all accounts added to device have been instantiated and cached
 * 2) Conversation list for all accounts added to device have been fetched from the network and cached
 * 3) Inbox ID for all accounts added to device have been fetched from the network and cached
 *
 * You can observe that logic in the HydrationStateHandler, and that will likely be moved once
 * we refactor accounts to be InboxID based in upcoming refactors.
 */
export const waitForXmtpClientHydration = (
  timeout: number = 1000
): Promise<void> => {
  const hydrationPromise = new Promise<void>((resolve) => {
    const { hydrationDone } = useAppStore.getState();
    if (hydrationDone) {
      resolve();
      return;
    }

    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      if (state.hydrationDone && !prevState.hydrationDone) {
        resolve();
        unsubscribe();
      }
    });
  });

  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Xmtp client hydration timed out"));
    }, timeout);
  });

  return Promise.race([hydrationPromise, timeoutPromise]);
};
