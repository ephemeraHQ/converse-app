import { getProfilesForAddresses } from "../../../utils/api";
import { getLensHandleFromConversationIdAndPeer } from "../../../utils/lens";
import { saveConversationIdentifiersForNotifications } from "../../../utils/notifications";
import { getRepository } from "../../db";
import { upsertRepository } from "../../db/upsert";
import { getChatStore, getProfilesStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { ProfileSocials } from "../../store/profilesStore";

type ConversationHandlesUpdate = {
  conversation: XmtpConversation;
  updated: boolean;
};

export const updateProfilesForConversations = async (
  account: string,
  conversations: XmtpConversation[]
) => {
  const profileRepository = await getRepository(account, "profile");
  const updates: ConversationHandlesUpdate[] = [];
  let batch: XmtpConversation[] = [];
  let rest = conversations;

  while (rest.length > 0) {
    batch = rest.slice(0, 150);
    rest = rest.slice(150);
    const addressesSet = new Set<string>();
    batch.forEach((c) => addressesSet.add(c.peerAddress));
    console.log(`Fetching ${addressesSet.size} profiles from API...`);
    const profilesByAddress = await getProfilesForAddresses(
      Array.from(addressesSet)
    );
    const now = new Date().getTime();
    console.log("Saving profiles to db...");
    // Save profiles to db
    await upsertRepository(
      profileRepository,
      Object.keys(profilesByAddress).map((address) => ({
        socials: JSON.stringify(profilesByAddress[address]),
        updatedAt: now,
        address,
      })),
      ["address"],
      false
    );
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

    console.log("Done saving profiles to db!");
    const handleConversation = async (conversation: XmtpConversation) => {
      const currentTitle = conversation.conversationTitle;
      let updated = false;
      try {
        const profileForConversation =
          profilesByAddress[conversation.peerAddress];
        let newLensHandle: string | null | undefined = null;
        if (profileForConversation) {
          newLensHandle = getLensHandleFromConversationIdAndPeer(
            conversation.context?.conversationId,
            profileForConversation.lensHandles
          );
        }
        const newEnsName = profilesByAddress[
          conversation.peerAddress
        ].ensNames?.find((e) => e.isPrimary)?.name;
        const newUnsDomain = profilesByAddress[
          conversation.peerAddress
        ].unstoppableDomains?.find((e) => e.isPrimary)?.domain;
        const newUserName = profilesByAddress[
          conversation.peerAddress
        ].userNames?.find((e) => e.isPrimary)?.name;
        const newTitle =
          newLensHandle || newUserName || newEnsName || newUnsDomain;
        if (newTitle !== currentTitle) {
          updated = true;
        }
        conversation.conversationTitle = newTitle;
      } catch (e) {
        // Error (probably rate limited)
        console.log("Could not resolve handles:", conversation.peerAddress, e);
      }

      updates.push({ conversation, updated });
      saveConversationIdentifiersForNotifications(conversation);
    };

    await Promise.all(batch.map(handleConversation));
  }

  return updates;
};

export const refreshProfileForAddress = async (
  account: string,
  address: string
) => {
  try {
    console.log(
      "@@ refreshProfileForAddress 1: Starting to get profiles for addresses"
    );

    const now = new Date().getTime();
    const profilesByAddress = await getProfilesForAddresses([address]);

    console.log(
      "@@ refreshProfileForAddress 2: Got profiles, starting upsertRepository"
    );
    console.log("profilesByAddress[address]:", profilesByAddress[address]);

    // Save profiles to db
    const profileRepository = await getRepository(account, "profile");

    console.log("profileRepository:", profileRepository);

    const upsertedRepo = await upsertRepository(
      profileRepository,
      Object.keys(profilesByAddress).map((address) => ({
        socials: JSON.stringify(profilesByAddress[address]),
        updatedAt: now,
        address,
      })),
      ["address"],
      true
    );

    console.log("@@ upsertedRepo:", upsertedRepo);

    console.log(
      "@@ refreshProfileForAddress 3: Upsert done, updating profiles store"
    );

    getProfilesStore(account)
      .getState()
      .setProfiles({
        [address]: {
          socials: profilesByAddress[address],
          updatedAt: now,
        },
      });

    console.log(
      "@@ refreshProfileForAddress 4: Completed refreshProfileForAddress"
    );
  } catch (error) {
    console.error("Error in refreshProfileForAddress:", error);
    throw error;
  }
};

export const refreshProfilesIfNeeded = async (account: string) => {
  const knownProfiles = getProfilesStore(account).getState().profiles;
  const conversations = Object.values(
    getChatStore(account).getState().conversations
  );
  const now = new Date().getTime();
  const conversationsWithStaleProfiles = conversations.filter((c) => {
    const existingProfile = knownProfiles[c.peerAddress];
    const lastProfileUpdate = existingProfile?.updatedAt || 0;
    const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;
    return shouldUpdateProfile;
  });
  if (conversationsWithStaleProfiles.length === 0) return;
  // If not connected we need to be able to save convo without querying the API for profiles
  updateProfilesForConversations(account, conversationsWithStaleProfiles).then(
    (resolveResult) => {
      const updatedConversations = resolveResult
        .filter((r) => r.updated)
        .map((r) => r.conversation);
      if (updatedConversations.length > 0) {
        getChatStore(account).getState().setConversations(updatedConversations);
      }
    }
  );
};
