import logger from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import { subscribeToNotifications } from "../../utils/notifications";

// Settings for each account setup in the app
// not all of them are really settings selected
// by users (i.e. ephemeralAccount is setup when user logs)

type NotificationsSettings = {
  showNotificationScreen: boolean;
};

export type PeersStatus = { [peerAddress: string]: "blocked" | "consented" };
export type InboxIdPeerStatus = { [inboxId: InboxId]: "allowed" | "denied" };
export type GroupStatus = { [groupId: string]: "allowed" | "denied" };

export type SettingsStoreType = {
  notifications: NotificationsSettings;
  setNotificationsSettings: (
    notificationsSettings: Partial<NotificationsSettings>
  ) => void;

  peersStatus: PeersStatus;
  setPeersStatus: (peersStatus: {
    [peerAddress: string]: "blocked" | "consented";
  }) => void;

  inboxIdPeerStatus: InboxIdPeerStatus;
  setInboxIdPeerStatus: (inboxIdPeerStatus: {
    [inboxId: InboxId]: "allowed" | "denied";
  }) => void;

  groupStatus: GroupStatus;
  setGroupStatus: (groupStatus: {
    [groupId: string]: "allowed" | "denied";
  }) => void;

  ephemeralAccount: boolean;
  setEphemeralAccount: (ephemeral: boolean) => void;

  lastAsyncUpdate: number;
  setLastAsyncUpdate: (version: number) => void;

  skipFarcaster: boolean;
  setSkipFarcaster: (s: boolean) => void;

  skipAddressBook: boolean;
  setSkipAddressBook: (s: boolean) => void;

  hasUserDismissedBanner: boolean;
  setHasUserDismissedBanner: (dismissed: boolean) => void;
};

export const initSettingsStore = (account: string) => {
  const settingsStore = create<SettingsStoreType>()(
    persist(
      (set) => ({
        notifications: {
          // On web we never show notifications screen
          showNotificationScreen: Platform.OS !== "web",
        },
        peersStatus: {},
        setPeersStatus: (peersStatus: {
          [peerAddress: string]: "blocked" | "consented";
        }) =>
          set((state) => {
            setImmediate(() => {
              subscribeToNotifications(account);
            });
            return {
              peersStatus: {
                ...state.peersStatus,
                ...Object.fromEntries(
                  Object.entries(peersStatus).map(([key, value]) => [
                    // Normalize to lowercase before merging
                    key.toLowerCase(),
                    value,
                  ])
                ),
              },
            };
          }),

        inboxIdPeerStatus: {},
        setInboxIdPeerStatus: (peersStatus: {
          [inboxId: InboxId]: "allowed" | "denied";
        }) =>
          set((state) => {
            return {
              inboxIdPeerStatus: {
                ...state.inboxIdPeerStatus,
                ...Object.fromEntries(
                  Object.entries(peersStatus).map(([key, value]) => [
                    // Normalize to lowercase before merging
                    key.toLowerCase(),
                    value,
                  ])
                ),
              },
            };
          }),

        groupStatus: {},
        setGroupStatus: (groupStatus: {
          [groupId: string]: "allowed" | "denied";
        }) =>
          set((state) => ({
            groupStatus: {
              ...state.groupStatus,
              ...groupStatus,
            },
          })),

        setNotificationsSettings: (notificationsSettings) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              ...notificationsSettings,
            },
          })),
        ephemeralAccount: false,
        setEphemeralAccount: (ephemeral) =>
          set(() => ({
            ephemeralAccount: ephemeral,
          })),
        lastAsyncUpdate: 0,
        setLastAsyncUpdate: (version) =>
          set(() => ({
            lastAsyncUpdate: version,
          })),
        skipFarcaster: false,
        setSkipFarcaster: (s) => set(() => ({ skipFarcaster: s })),
        skipAddressBook: false,
        setSkipAddressBook: (s) => set(() => ({ skipAddressBook: s })),
        hasUserDismissedBanner: false,
        setHasUserDismissedBanner: (dismissed) =>
          set({ hasUserDismissedBanner: dismissed }),
      }),
      {
        name: `store-${account}-settings`, // Account-based storage so each account can have its own settings
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
        migrate: (persistedState: any, version: number): SettingsStoreType => {
          logger.debug("Zustand migration version:", version);

          // Migration from version 0: Convert 'blockedPeers' to 'peersStatus'
          if (version === 0 && persistedState.blockedPeers) {
            persistedState.peersStatus = {};
            for (const peerAddress in persistedState.blockedPeers) {
              persistedState.peersStatus[peerAddress] = "blocked";
            }
            delete persistedState.blockedPeers;
          }
          return persistedState as SettingsStoreType;
        },
      }
    )
  );
  return settingsStore;
};
