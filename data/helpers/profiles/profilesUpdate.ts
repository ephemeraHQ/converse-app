import { getProfilesForAddresses } from "../../../utils/api";
import { getLensHandleFromConversationIdAndPeer } from "../../../utils/lens";
import { saveConversationIdentifiersForNotifications } from "../../../utils/notifications";
import { getRepository } from "../../db";
import { upsertRepository } from "../../db/upsert";
import { getProfilesStore } from "../../store/accountsStore";
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
  const profileRepository = getRepository(account, "profile");
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
      ["address"]
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
        const newTitle = newLensHandle || newEnsName || newUnsDomain;
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
  const now = new Date().getTime();
  const profilesByAddress = await getProfilesForAddresses([address]);
  // Save profiles to db
  const profileRepository = getRepository(account, "profile");
  await upsertRepository(
    profileRepository,
    Object.keys(profilesByAddress).map((address) => ({
      socials: JSON.stringify(profilesByAddress[address]),
      updatedAt: now,
      address,
    })),
    ["address"]
  );
  getProfilesStore(account)
    .getState()
    .setProfiles({
      [address]: {
        socials: profilesByAddress[address],
        updatedAt: now,
      },
    });
};
