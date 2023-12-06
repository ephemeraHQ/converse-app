import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import { subscribeToNotifications } from "../../utils/notifications";

// Settings for each account setup in the app
// not all of them are really settings selected
// by users (i.e. ephemeralAccount is setup when user logs)

type NotificationsSettings = {
  showNotificationScreen: boolean;
};

export type SettingsStoreType = {
  notifications: NotificationsSettings;
  setNotificationsSettings: (
    notificationsSettings: Partial<NotificationsSettings>
  ) => void;

  peersStatus: { [peerAddress: string]: "blocked" | "consented" };
  setPeersStatus: (peersStatus: {
    [peerAddress: string]: "blocked" | "consented";
  }) => void;

  ephemeralAccount: boolean;
  setEphemeralAccount: (ephemeral: boolean) => void;

  lastAsyncUpdate: string;
  setLastAsyncUpdate: (version: string) => void;
};

export const initSettingsStore = (account: string) => {
  const profilesStore = create<SettingsStoreType>()(
    persist(
      (set) =>
        ({
          notifications: {
            showNotificationScreen: true,
          },
          setNotificationsSettings: (notificationsSettings) =>
            set((state) => ({
              notifications: {
                ...state.notifications,
                ...notificationsSettings,
              },
            })),

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

          ephemeralAccount: false,
          setEphemeralAccount: (ephemeral) =>
            set(() => ({ ephemeralAccount: ephemeral })),

          lastAsyncUpdate: "",
          setLastAsyncUpdate: (version) =>
            set(() => ({ lastAsyncUpdate: version })),
        }) as SettingsStoreType,
      {
        name: `store-${account}-settings`, // Account-based storage so each account can have its own settings
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
        partialize: (state) => ({
          lastAsyncUpdate: state.lastAsyncUpdate,
        }),
        migrate: (persistedState: any, version: number): SettingsStoreType => {
          console.log("Zustand migration version:", version);

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
  return profilesStore;
};
