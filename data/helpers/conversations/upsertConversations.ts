import { getLensHandleFromConversationIdAndPeer } from "../../../utils/lens";
import { saveConversationIdentifiersForNotifications } from "../../../utils/notifications";
import { conversationRepository } from "../../db";
import dataSource from "../../db/datasource";
import { upsertRepository } from "../../db/upsert";
import { xmtpConversationToDb } from "../../mappers";
import { useChatStore, useProfilesStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { updateProfilesForConversations } from "../profiles/profilesUpdate";
import { upgradePendingConversationIfNeeded } from "./pendingConversations";

export const saveConversations = async (
  conversations: XmtpConversation[],
  forceUpdate = false
) => {
  const chatStoreState = useChatStore.getState();
  const alreadyKnownConversations: XmtpConversation[] = [];
  const conversationsToUpsert: XmtpConversation[] = [];
  conversations.forEach((c) => {
    if (!chatStoreState.conversations[c.topic] || forceUpdate) {
      conversationsToUpsert.push(c);
    } else {
      alreadyKnownConversations.push(c);
    }
  });

  // Save immediatly to db the new ones
  const newlySavedConversations = await Promise.all(
    conversationsToUpsert.map((c) => setupAndSaveConversation(c))
  );
  // Then to context so it show immediatly even without handle
  chatStoreState.setConversations(newlySavedConversations);

  // Let's find out which need to have the profile updated
  const knownProfiles = useProfilesStore.getState().profiles;
  const convosWithProfilesToUpdate: XmtpConversation[] = [];
  const now = new Date().getTime();
  [alreadyKnownConversations, newlySavedConversations].forEach(
    (conversationList) => {
      conversationList.forEach((c) => {
        const existingProfile = knownProfiles[c.peerAddress];
        const lastProfileUpdate = existingProfile?.updatedAt || 0;
        const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;
        if (shouldUpdateProfile) {
          convosWithProfilesToUpdate.push(c);
        }
      });
    }
  );

  if (convosWithProfilesToUpdate.length === 0) return;
  const resolveResult = await updateProfilesForConversations(
    convosWithProfilesToUpdate
  );

  const updatedConversations = resolveResult
    .filter((r) => r.updated)
    .map((r) => r.conversation);
  if (updatedConversations.length > 0) {
    useChatStore.getState().setConversations(updatedConversations);
  }
};

export const setupAndSaveConversation = async (
  conversation: XmtpConversation
): Promise<XmtpConversation> => {
  await upgradePendingConversationIfNeeded(conversation);
  const alreadyConversationInDbWithTopic = await conversationRepository.findOne(
    {
      where: { topic: conversation.topic },
    }
  );

  const profileSocials =
    useProfilesStore.getState().profiles[conversation.peerAddress]?.socials;

  const lensHandle = getLensHandleFromConversationIdAndPeer(
    conversation.context?.conversationId,
    profileSocials?.lensHandles
  );
  const ensName =
    profileSocials?.ensNames?.find((e) => e.isPrimary)?.name || null;
  const unsDomain =
    profileSocials?.unstoppableDomains?.find((e) => e.isPrimary)?.domain ||
    null;

  // If this is a lens convo we show lens, if not ENS
  conversation.conversationTitle = lensHandle || ensName || unsDomain;
  conversation.readUntil =
    conversation.readUntil || alreadyConversationInDbWithTopic?.readUntil || 0;

  // Save to db
  await upsertRepository(
    conversationRepository,
    [xmtpConversationToDb(conversation)],
    ["topic"]
  );

  saveConversationIdentifiersForNotifications(conversation);

  return conversation;
};

export const markAllConversationsAsReadInDb = async () => {
  await dataSource.query(
    `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
  );
};

export const markConversationReadUntil = async (
  topic: string,
  readUntil: number
) => {
  await conversationRepository.update({ topic }, { readUntil });
};
