import {
  getCurrentAccountEthAddress,
  useCurrentAccount,
} from "../authentication/account.store";
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

export function useDenyDmMutation() {
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
      const currentAccount = getCurrentAccountEthAddress()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: "deny",
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "deny",
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
          state: "denied",
        });

        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: peerInboxId,
          dm: updatedDm as DmWithCodecsType,
        });

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          account: currentAccount,
          topic,
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

        // Add back to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          account: currentAccount,
          conversation: previousDm as ConversationWithCodecsType,
        });

        // Add back to requests
        addConversationToUnknownConsentConversationsQuery({
          account: currentAccount,
          conversation: previousDm as ConversationWithCodecsType,
        });
      }
    },
  });
}
