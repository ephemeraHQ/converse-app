import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationInUnknownConsentConversationsQueryData } from "@/queries/unknown-consent-conversations-query";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { updateConsentForGroupsForAccount } from "./update-consent-for-groups-for-account";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";

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
      const currentAccount = getCurrentAccount()!;
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
    onMutate: ({ topic }) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: "denied",
        });

        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm as DmWithCodecsType,
        });

        updateConversationInConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: "denied",
          },
        });

        updateConversationInUnknownConsentConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: "denied",
          },
        });

        return { previousDmConsent: conversation.state };
      }
    },
    onError: (error, { topic }, context) => {
      const { previousDmConsent } = context || {};
      if (previousDmConsent) {
        const dm = getDmQueryData({
          account: currentAccount,
          peer: topic,
        });

        if (!dm) {
          return;
        }

        const updatedDm = updateObjectAndMethods(dm, {
          state: previousDmConsent,
        });

        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm,
        });

        updateConversationInConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: previousDmConsent,
          },
        });

        updateConversationInUnknownConsentConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: previousDmConsent,
          },
        });
      }
    },
  });
}
