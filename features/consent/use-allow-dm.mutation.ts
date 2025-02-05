import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/conversation-query";
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/queries/conversations-allowed-consent-query";
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/queries/conversations-unknown-consent-query";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import {
  ConversationWithCodecsType,
  DmWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { updateInboxIdsConsentForAccount } from "@/features/consent/update-inbox-ids-consent-for-account";
import { updateConsentForGroupsForAccount } from "@/features/consent/update-consent-for-groups-for-account";
export function useAllowDmMutation() {
  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: InboxId;
      conversationId: ConversationId;
      topic: ConversationTopic;
    }) => {
      const { peerInboxId, conversationId } = args;
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: "allow",
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "allow",
        }),
      ]);
    },
    onMutate: ({ topic, peerInboxId }) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: "allowed",
        });

        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: peerInboxId,
          dm: updatedDm as DmWithCodecsType,
        });

        // Add to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          account: currentAccount,
          conversation: updatedDm as ConversationWithCodecsType,
        });

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQueryData({
          account: currentAccount,
          topic,
        });

        return { previousDmConsent: conversation.state };
      }
    },
    onError: (error, { topic, peerInboxId }, context) => {
      const { previousDmConsent } = context || {};
      if (previousDmConsent) {
        const dm = getDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: peerInboxId,
        });

        if (!dm) {
          return;
        }

        const previousDm = updateObjectAndMethods(dm, {
          state: previousDmConsent,
        });

        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: peerInboxId,
          dm: previousDm,
        });

        // Add back in requests
        addConversationToUnknownConsentConversationsQuery({
          account: currentAccount,
          conversation: previousDm as ConversationWithCodecsType,
        });

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          account: currentAccount,
          topic,
        });
      }
    },
  });
}
