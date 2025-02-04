import { getCurrentAccount } from "@/data/store/accountsStore";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { queryClient } from "@/queries/queryClient";
import { ensureDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { isSameInboxId } from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";
import { InboxId } from "@xmtp/react-native-sdk";
import { useEffect } from "react";

export function useConversationCreateListenToSelectedMembers() {
  const conversationStore = useConversationStore();

  useEffect(() => {
    conversationStore.subscribe(async (nextState, previousState) => {
      try {
        console.log(
          "nextState.searchSelectedUserInboxIds:",
          nextState.searchSelectedUserInboxIds
        );

        if (
          nextState.searchSelectedUserInboxIds.length ===
          previousState.searchSelectedUserInboxIds.length
        ) {
          return;
        }

        const conversation = await findConversationByMembers({
          inboxIds: nextState.searchSelectedUserInboxIds,
        });

        conversationStore.setState({
          topic: conversation?.topic ?? null,
        });
      } catch (error) {
        captureError(error);
      }
    });
  }, [conversationStore]);
}

async function findConversationByMembers({
  inboxIds,
}: {
  inboxIds: InboxId[];
}) {
  const account = getCurrentAccount();

  if (!account) {
    throw new Error("No account found");
  }

  if (inboxIds.length === 0) {
    return undefined;
  }

  const conversations = await queryClient.ensureQueryData(
    getAllowedConsentConversationsQueryOptions({
      account,
      caller: "findConversationByMembers",
    })
  );

  if (!conversations) {
    return undefined;
  }

  const groups = conversations.filter(isConversationGroup);
  const dms = conversations.filter(isConversationDm);

  // Fetch all group members data
  const groupMembersData = await Promise.all(
    groups.map((conversation) =>
      ensureGroupMembersQueryData({
        account,
        topic: conversation.topic,
      })
    )
  );

  // Check groups first
  const matchingGroup = groups.find((group, index) => {
    const memberIds = groupMembersData[index]?.ids;
    if (!memberIds) return false;
    return memberIds.every((memberId) =>
      inboxIds.some((inboxId) => isSameInboxId(memberId, inboxId))
    );
  });

  // If we found a group or if we're looking for multiple members, return the result
  if (matchingGroup || inboxIds.length > 1) {
    return matchingGroup;
  }

  // For DMs, only check if we have a single inboxId
  const dmPeerInboxIds = await Promise.all(
    dms.map((dm) =>
      ensureDmPeerInboxIdQueryData({
        account,
        topic: dm.topic,
        caller: "findConversationByMembers",
      })
    )
  );

  return dms.find((_, index) => {
    const peerInboxId = dmPeerInboxIds[index];
    return peerInboxId && isSameInboxId(inboxIds[0], peerInboxId);
  });
}
