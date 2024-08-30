import { setProfileSocialsQueryData } from "@queries/useProfileSocialsQuery";
import { getCleanAddress } from "@utils/evm/address";

import { getProfilesForAddresses } from "../../../utils/api";
import { getProfile } from "../../../utils/profile";
import { getChatStore, getProfilesStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { ProfileSocials } from "../../store/profilesStore";

export const updateProfilesForConvos = async (
  account: string,
  profilesWithGroups: Map<string, XmtpConversation[]>
) => {
  let batch: string[] = [];
  let rest = Array.from(profilesWithGroups.keys());

  while (rest.length > 0) {
    batch = rest.slice(0, 150);
    rest = rest.slice(150);
    const addressesSet = new Set(batch);
    const profilesByAddress = await getProfilesForAddresses(
      Array.from(addressesSet)
    );
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
    for (const peerAddress in socialsToDispatch) {
      setProfileSocialsQueryData(
        account,
        peerAddress,
        socialsToDispatch[peerAddress].socials,
        socialsToDispatch[peerAddress].updatedAt
      );
    }
  }
};

export const refreshProfileForAddress = async (
  account: string,
  address: string
) => {
  const now = new Date().getTime();
  const profilesByAddress = await getProfilesForAddresses([address]);
  // Save profiles to db

  setProfileSocialsQueryData(account, address, profilesByAddress[address], now);
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
