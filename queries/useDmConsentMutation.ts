import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { DmWithCodecsType } from "@/utils/xmtpRN/client";
import {
  consentToGroupsOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "@/utils/xmtpRN/contacts";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";

export function useDmConsentMutation(args: {
  peerInboxId: InboxId;
  conversationId: ConversationId;
  topic: ConversationTopic;
}) {
  const { peerInboxId, conversationId, topic } = args;

  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async (args: { consent: "allow" | "deny" }) => {
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        consentToGroupsOnProtocolByAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: args.consent,
        }),
        consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: args.consent,
        }),
      ]);
    },
    onMutate: (args) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = mutateObjectProperties(conversation, {
          state: args.consent === "allow" ? "allowed" : "denied",
        });
        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm as DmWithCodecsType,
        });
        updateConversationInConversationListQuery({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: args.consent === "allow" ? "allowed" : "denied",
          },
        });
        return { previousDmConsent: conversation.state };
      }
    },
    onError: (error, _, context) => {
      const { previousDmConsent } = context || {};
      if (previousDmConsent) {
        const dm = getDmQueryData({
          account: currentAccount,
          peer: topic,
        });
        if (!dm) {
          return;
        }
        const updatedDm = mutateObjectProperties(dm, {
          state: previousDmConsent,
        });
        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm,
        });
        updateConversationInConversationListQuery({
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
