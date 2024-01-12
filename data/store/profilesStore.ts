import { Platform } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

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
};

export type FarcasterUsername = {
  username: string;
  name?: string;
  avatarURI?: string;
};

export type UnstoppableDomain = {
  domain: string;
  isPrimary: boolean;
};

export type UserName = {
  name: string;
  isPrimary: boolean;
};

export type ProfileSocials = {
  ensNames?: EnsName[];
  farcasterUsernames?: FarcasterUsername[];
  lensHandles?: LensHandle[];
  unstoppableDomains?: UnstoppableDomain[];
  userNames?: UserName[];
};

export type ProfileByAddress = {
  [address: string]: { socials: ProfileSocials; updatedAt: number } | undefined;
};

export type ProfilesStoreType = {
  profiles: ProfileByAddress;
  setProfiles: (profiles: ProfileByAddress) => void;
};

export const initProfilesStore = (account: string) => {
  const profilesStore = create<ProfilesStoreType>()(
    persist(
      (set) => ({
        profiles: {},
        // Setter keeps existing profiles but upserts new ones
        setProfiles: (profiles) =>
          set((state) => ({ profiles: { ...state.profiles, ...profiles } })),
      }),
      {
        name: `store-${account}-profiles`, // Account-based storage so each account can have its own recos
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => {
          // On web, we persist profiles because we don't store it to SQL
          if (Platform.OS === "web") {
            return state;
          } else {
            return undefined;
          }
        },
      }
    )
  );
  return profilesStore;
};
