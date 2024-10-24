import { getCleanAddress } from "@utils/evm/address";
import logger from "@utils/logger";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  logger.debug("[ProfilesStore] Initializing store for account", { account });

  const profilesStore = create<ProfilesStoreType>()(
    persist(
      (set) => ({
        profiles: {},

        setProfiles: (profiles) => {
          logger.debug("[ProfilesStore] Setting profiles", {
            profileCount: Object.keys(profiles).length,
            addresses: Object.keys(profiles),
          });

          set((state) => {
            const newProfiles = { ...state.profiles, ...profiles };
            logger.debug("[ProfilesStore] Updated profiles state", {
              totalProfiles: Object.keys(newProfiles).length,
            });
            return { profiles: newProfiles };
          });
        },

        saveSocials: (socials) => {
          logger.debug("[ProfilesStore] Saving socials", {
            addressCount: Object.keys(socials).length,
          });

          set((state) => {
            const newState = { ...state };
            const now = new Date().getTime();

            Object.keys(socials).forEach((address) => {
              const cleanAddress = getCleanAddress(address);
              logger.debug("[ProfilesStore] Processing social for address", {
                originalAddress: address,
                cleanAddress,
                socialTypes: Object.keys(socials[address]),
              });

              newState.profiles[cleanAddress] = {
                socials: socials[address],
                updatedAt: now,
              };
            });

            logger.debug("[ProfilesStore] Socials save complete", {
              totalProfiles: Object.keys(newState.profiles).length,
            });
            return newState;
          });
        },

        refreshFromStorage: () => {
          logger.debug("[ProfilesStore] Attempting to refresh from storage", {
            account,
          });

          set((state) => {
            const mmkvState = mmkv.getString(`store-${account}-profiles`);

            if (!mmkvState) {
              logger.debug("[ProfilesStore] No stored state found");
              return state;
            }

            try {
              const parsed = JSON.parse(mmkvState);
              logger.debug("[ProfilesStore] Successfully loaded stored state", {
                profileCount: Object.keys(parsed.state.profiles || {}).length,
              });
              return parsed.state;
            } catch (error) {
              logger.error(
                "[ProfilesStore] Failed to refresh from storage:",
                error,
                {
                  context: "Could not refresh profiles from storage",
                  account,
                }
              );
            }
            return state;
          });
        },
      }),
      {
        name: `store-${account}-profiles`,
        storage: createJSONStorage(() => zustandMMKVStorage),
        onRehydrateStorage: () => (state) => {
          if (state) {
            logger.debug("[ProfilesStore] Store rehydrated successfully", {
              account,
              profileCount: Object.keys(state.profiles || {}).length,
            });
          } else {
            logger.warn("[ProfilesStore] Store rehydrated with no state", {
              account,
            });
          }
        },
      }
    )
  );

  logger.debug("[ProfilesStore] Store initialization complete", { account });
  return profilesStore;
};
