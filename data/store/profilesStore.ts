import { getCleanAddress } from "@utils/evm/getCleanAddress";
import logger from "@utils/logger";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";

export type LensHandle = {
  profileId: string;
  handle: string;
  isDefault: boolean;
  name?: string;
  profilePictureURI?: string;
};

export type EnsName = {
  name: string;
  isPrimary: boolean;
  displayName?: string | undefined;
  avatar?: string | undefined;
};

export type FarcasterUsername = {
  username: string;
  name?: string;
  avatarURI?: string;
  linkedAccount?: boolean;
};

export type UnstoppableDomain = {
  domain: string;
  isPrimary: boolean;
};

export type ConverseUserName = {
  name: string;
  isPrimary: boolean;
  displayName?: string | undefined;
  avatar?: string | undefined;
};

export type ProfileSocials = {
  address?: string;
  ensNames?: EnsName[];
  farcasterUsernames?: FarcasterUsername[];
  lensHandles?: LensHandle[];
  unstoppableDomains?: UnstoppableDomain[];
  userNames?: ConverseUserName[];
};

export type ProfileByAddress = {
  [address: string]: { socials: ProfileSocials; updatedAt: number } | undefined;
};

export type ProfilesStoreType = {
  profiles: ProfileByAddress;
  setProfiles: (profiles: ProfileByAddress) => void;
  saveSocials: (socials: { [address: string]: ProfileSocials }) => void;
  refreshFromStorage: () => void;
};

export const initProfilesStore = (account: string) => {
  const profilesStore = create<ProfilesStoreType>()(
    persist(
      (set) => ({
        profiles: {},
        // Setter keeps existing profiles but upserts new ones
        setProfiles: (profiles) =>
          set((state) => ({ profiles: { ...state.profiles, ...profiles } })),
        saveSocials: (socials) =>
          set((state) => {
            const newState = { ...state };
            const now = new Date().getTime();
            Object.keys(socials).forEach((address) => {
              newState.profiles[getCleanAddress(address)] = {
                socials: socials[address],
                updatedAt: now,
              };
            });
            return newState;
          }),
        refreshFromStorage: () =>
          set((state) => {
            const mmkvState = mmkv.getString(`store-${account}-profiles`);
            if (!mmkvState) return state;
            try {
              const state = JSON.parse(mmkvState) as ProfilesStoreType;
              return state;
            } catch (error) {
              logger.error(error, {
                context: "Could not refresh profiles from storage",
              });
            }
            return state;
          }),
      }),
      {
        name: `store-${account}-profiles`, // Account-based storage so each account can have its own recos
        storage: createJSONStorage(() => zustandMMKVStorage),
      }
    )
  );
  return profilesStore;
};
