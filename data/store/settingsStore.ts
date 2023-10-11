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
};

export const initSettingsStore = (account: string) => {
  const profilesStore = create<SettingsStoreType>()(
    persist(
      (set) =>
        ({
          notifications: {
            showNotificationScreen: true,
          },
          peersStatus: {},
          setPeersStatus: (peersStatus: {
            [peerAddress: string]: "blocked" | "consented";
          }) =>
            set((state) => {
              // Normalize to lowercase before merging
              const updatedPeersStatus = {
                ...Object.fromEntries(
                  Object.entries(state.peersStatus).map(([key, value]) => [
                    key.toLowerCase(),
                    value,
                  ])
                ),
                ...Object.fromEntries(
                  Object.entries(peersStatus).map(([key, value]) => [
                    key.toLowerCase(),
                    value,
                  ])
                ),
              };
              setImmediate(() => {
                subscribeToNotifications(account);
              });
              return { peersStatus: updatedPeersStatus };
            }),
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
        }) as SettingsStoreType,
      {
        name: `store-${account}-settings`, // Account-based storage so each account can have its own settings
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
        migrate: (persistedState: any, version: number): SettingsStoreType => {
          console.log("Zustand migration version:", version);

          // Migration from version 0: Convert 'blockedPeers' to 'peersStatus'
          if (version === 0 && persistedState.blockedPeers) {
            persistedState.peersStatus = {};
            for (const [peerAddress, isBlocked] of Object.entries(
              persistedState.blockedPeers
            )) {
              persistedState.peersStatus[peerAddress] = isBlocked
                ? "blocked"
                : "consented";
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
