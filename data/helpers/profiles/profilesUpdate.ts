import { getCleanAddress } from "@utils/evm/address";
import logger from "@utils/logger";

import { getProfilesForAddresses } from "../../../utils/api";
import { getProfile } from "../../../utils/profile";
import { getChatStore, getProfilesStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { ProfileSocials } from "../../store/profilesStore";

export const updateProfilesForConvos = async (
  account: string,
  profilesWithGroups: Map<string, XmtpConversation[]>
) => {
  logger.debug("[ProfilesUpdate] Starting profiles update", {
    account,
    profileCount: profilesWithGroups.size,
  });

  let batch: string[] = [];
  let rest = Array.from(profilesWithGroups.keys());

  while (rest.length > 0) {
    batch = rest.slice(0, 150);
    rest = rest.slice(150);
    logger.debug("[ProfilesUpdate] Processing batch", {
      batchSize: batch.length,
      remaining: rest.length,
    });

    const addressesSet = new Set(batch);
    const profilesByAddress = await getProfilesForAddresses(
      Array.from(addressesSet)
    );

    logger.debug("[ProfilesUpdate] Profiles fetched", {
      fetchedCount: Object.keys(profilesByAddress).length,
    });

    const now = new Date().getTime();
    // Dispatching the profile to state
    const socialsToDispatch: {
      [address: string]: { socials: ProfileSocials; updatedAt: number };
    } = {};
    for (const address in profilesByAddress) {
      socialsToDispatch[address] = {
        socials: profilesByAddress[address],
        updatedAt: now,
      };
    }
    getProfilesStore(account).getState().setProfiles(socialsToDispatch);
  }
};

export const refreshProfileForAddress = async (
  account: string,
  address: string
) => {
  logger.debug("[ProfilesUpdate] Refreshing single profile", {
    account,
    address,
  });

  try {
    const now = new Date().getTime();
    const profilesByAddress = await getProfilesForAddresses([address]);
    logger.debug("[ProfilesUpdate] Profile fetched successfully");

    // Save profiles to db

    getProfilesStore(account)
      .getState()
      .setProfiles({
        [address]: {
          socials: profilesByAddress[address],
          updatedAt: now,
        },
      });
  } catch (error) {
    logger.error("[ProfilesUpdate] Error refreshing profile:", error);
  }
};

export const refreshProfilesIfNeeded = async (account: string) => {
  const knownProfiles = getProfilesStore(account).getState().profiles;
  const conversations = Object.values(
    getChatStore(account).getState().conversations
  );
  const now = new Date().getTime();
  const staleProfilesWithConversations: Map<string, XmtpConversation[]> =
    new Map();
  conversations.forEach((c) => {
    if (!c.isGroup) {
      const existingProfile = getProfile(c.peerAddress, knownProfiles);
      const lastProfileUpdate = existingProfile?.updatedAt || 0;
      const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;
      if (shouldUpdateProfile) {
        const existing =
          staleProfilesWithConversations.get(c.peerAddress) || [];
        existing.push(c);
        staleProfilesWithConversations.set(c.peerAddress, existing);
      }
    } else {
      const groupMembers: string[] =
        typeof c.groupMembers === "string"
          ? (c as any).groupMembers.split(",")
          : c.groupMembers;
      groupMembers.forEach((_memberAddress) => {
        const memberAddress = getCleanAddress(_memberAddress);
        const existingProfile = getProfile(memberAddress, knownProfiles);
        const lastProfileUpdate = existingProfile?.updatedAt || 0;
        const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;
        if (shouldUpdateProfile) {
          const existing =
            staleProfilesWithConversations.get(memberAddress) || [];
          existing.push(c);
          staleProfilesWithConversations.set(memberAddress, existing);
        }
      });
    }
  });

  if (staleProfilesWithConversations.size > 0) {
    updateProfilesForConvos(account, staleProfilesWithConversations);
  }
};
