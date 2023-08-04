import { getLensHandleFromConversationIdAndPeer } from "../../../utils/lens";
import { saveConversationIdentifiersForNotifications } from "../../../utils/notifications";
import { sentryTrackMessage } from "../../../utils/sentry";
import { conversationRepository, profileRepository } from "../../db";
import dataSource from "../../db/datasource";
import { ProfileEntity } from "../../db/entities/profileEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpConversationToDb } from "../../mappers";
import { useChatStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { updateProfilesForConversations } from "../profiles/profilesUpdate";
import { upgradePendingConversationIfNeeded } from "./pendingConversations";

export const saveConversations = async (conversations: XmtpConversation[]) => {
  // Save immediatly to db
  const saveResult = await Promise.all(
    conversations.map((c) => setupAndSaveConversation(c))
  );
  // Then to context
  useChatStore
    .getState()
    .setConversations(saveResult.map((r) => r.conversation));
  try {
    // Now let's see what profiles need to be updated
    const convosToUpdate = saveResult
      .filter((c) => c.shouldUpdateProfile)
      .map((c) => c.conversation);
    if (convosToUpdate.length === 0) return;
    const resolveResult = await updateProfilesForConversations(convosToUpdate);

    const updatedConversations = resolveResult
      .filter((r) => r.updated)
      .map((r) => r.conversation);
    if (updatedConversations.length > 0) {
      useChatStore.getState().setConversations(updatedConversations);
    }
  } catch (e: any) {
    sentryTrackMessage("SAVE_CONVO_PROFILE_UPDATE_FAILED", {
      error: e.toString(),
    });
    console.log(e);
  }
};

// export const saveNewConversation = async (
//   conversation: XmtpConversation,
//   dispatch: MaybeDispatchType
// ) => {
//   // Save immediatly to db
//   const saveResult = await setupAndSaveConversation(conversation, dispatch);
//   // Then to context
//   if (dispatch) {
//     dispatch({
//       type: XmtpDispatchTypes.XmtpNewConversation,
//       payload: {
//         conversation,
//       },
//     });
//   }
//   try {
//     // Now let's see if conversation needs to have a handle resolved
//     if (saveResult.shouldUpdateProfile) {
//       const resolveResult = (
//         await updateProfilesForConversations(
//           [saveResult.conversation],
//           dispatch
//         )
//       )[0];
//       if (dispatch && resolveResult.updated) {
//         dispatch({
//           type: XmtpDispatchTypes.XmtpSetConversations,
//           payload: {
//             conversations: [resolveResult.conversation],
//           },
//         });
//       }
//     }
//   } catch (e: any) {
//     sentryTrackMessage("NEW_CONVO_PROFILE_UPDATE_FAILED", {
//       error: e.toString(),
//     });
//     console.log(e);
//   }
// };

type HandlesToResolve = {
  conversation: XmtpConversation;
  shouldUpdateProfile: boolean;
};

export const setupAndSaveConversation = async (
  conversation: XmtpConversation
): Promise<HandlesToResolve> => {
  await upgradePendingConversationIfNeeded(conversation);
  const alreadyConversationInDbWithTopic = await conversationRepository.findOne(
    {
      where: { topic: conversation.topic },
    }
  );

  let alreadyProfileInDb: ProfileEntity | null = null;
  if (alreadyConversationInDbWithTopic) {
    alreadyProfileInDb = await profileRepository.findOne({
      where: { address: alreadyConversationInDbWithTopic.peerAddress },
    });
  }
  const lastProfileUpdate = alreadyProfileInDb?.updatedAt || 0;
  const now = new Date().getTime();
  const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;

  const profileSocials = alreadyProfileInDb?.getSocials();

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

  return {
    conversation,
    shouldUpdateProfile,
  };
};

export const markAllConversationsAsReadInDb = async () => {
  await dataSource.query(
    `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
  );
};
