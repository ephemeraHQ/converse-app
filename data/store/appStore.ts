import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import logger from "@/utils/logger";
import { wait } from "@/utils/wait";

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
 * As of December 19, 2024, when we say XMTP client hydration, we mean that the following are true:
 * 1) XMTP client for all accounts added to device have been instantiated and cached
 * 2) Conversation list for all accounts added to device have been fetched from the network and cached
 * 3) Inbox ID for all accounts added to device have been fetched from the network and cached
 *
 * You can observe that logic in the HydrationStateHandler, and that will likely be moved once
 * we refactor accounts to be InboxID based in upcoming refactors.
 */
export const waitForXmtpClientHydration = (): Promise<void> => {
  const hydrationPromise = new Promise<void>((resolve) => {
    const { hydrationDone } = useAppStore.getState();
    if (hydrationDone) {
      logger.debug(
        "[waitForXmtpClientHydrationWithTimeout] Already hydrated, resolving"
      );
      resolve();
      return;
    }

    logger.debug(
      "[waitForXmtpClientHydrationWithTimeout] Not hydrated, subscribing"
    );
    const unsubscribe = useAppStore.subscribe(async (state, prevState) => {
      logger.debug(
        `[waitForXmtpClientHydrationWithTimeout] Hydration state changed: ${prevState.hydrationDone} -> ${state.hydrationDone}`
      );
      if (state.hydrationDone && !prevState.hydrationDone) {
        logger.debug(
          `[waitForXmtpClientHydrationWithTimeout] waiting a split second before resolving to allow next render`
        );

        // Wait for the next render to complete
        // note(lustig): this is a hack to ensure that the next render has completed
        // as this is used to navigate to a conversation currently.
        // We'll revisit this and make something that doesn't suck as much later.
        await wait(1);

        logger.debug(
          `[waitForXmtpClientHydrationWithTimeout] resolving promise`
        );
        resolve();
        unsubscribe();
      }
    });
  });

  return hydrationPromise;
};
