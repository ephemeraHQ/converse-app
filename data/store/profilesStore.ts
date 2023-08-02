import { create } from "zustand";

import { currentAccountStoreHook } from "./accountsStore";

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

export type ProfileSocials = {
  ensNames?: EnsName[];
  farcasterUsernames?: FarcasterUsername[];
  lensHandles?: LensHandle[];
  unstoppableDomains?: UnstoppableDomain[];
};

export type ProfileByAddress = {
  [address: string]: { socials: ProfileSocials } | undefined;
};

export type ProfilesStoreType = {
  profiles: ProfileByAddress;
  setProfiles: (profiles: ProfileByAddress) => void;
};

export const initProfilesStore = () => {
  const profilesStore = create<ProfilesStoreType>()((set) => ({
    profiles: {},
    // Setter keeps existing profiles but upserts new ones
    setProfiles: (profiles) =>
      set((state) => ({ profiles: { ...state.profiles, ...profiles } })),
  }));
  return profilesStore;
};

export const useProfilesStore = currentAccountStoreHook("profiles");
