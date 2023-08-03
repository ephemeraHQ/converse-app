import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Settings for each account setup in the app
// not all of them are really settings selected
// by users (i.e. ephemeralAccount is setup when user logs)

export type NotificationsSettings = {
  showNotificationScreen: boolean;
};

export type SettingsStoreType = {
  notifications: NotificationsSettings;
  setNotificationsSettings: (
    notificationsSettings: Partial<NotificationsSettings>
  ) => void;

  blockedPeers: { [peerAddress: string]: boolean };
  setBlockedPeers: (peers: string[]) => void;
  setBlockedPeerStatus: (peerAddress: string, blocked: boolean) => void;

  ephemeralAccount: boolean;
  setEphemeralAccount: (ephemeral: boolean) => void;
};

export const initSettingsStore = (account: string) => {
  const profilesStore = create<SettingsStoreType>()(
    persist(
      (set) => ({
        notifications: {
          showNotificationScreen: true,
        },
        blockedPeers: {},
        setBlockedPeers: (peers) =>
          set(() => {
            const newBlockedPeers: { [peerAddress: string]: boolean } = {};
            peers.forEach((p) => (newBlockedPeers[p] = true));
            return { blockedPeers: newBlockedPeers };
          }),
        setBlockedPeerStatus: (peerAddress, blocked) =>
          set((state) => {
            const blockedPeerAddresses = { ...state.blockedPeers };
            if (blocked) {
              blockedPeerAddresses[peerAddress.toLowerCase()] = true;
            } else {
              delete blockedPeerAddresses[peerAddress.toLowerCase()];
            }
            return { blockedPeers: blockedPeerAddresses };
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
      }),
      {
        name: `store-${account}-settings`, // Account-based storage so each account can have its own settings
        storage: createJSONStorage(() => zustandMMKVStorage),
      }
    )
  );
  return profilesStore;
};
