// import {
//   getCurrentAccount,
//   useCurrentAccount,
// } from "@/data/store/accountsStore";
import { currentInboxId, getCurrentInboxId } from "@/data/store/accountsStore";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import {
  consentToGroupsByGroupIds,
  consentToInboxIdsOnProtocolByInboxId,
} from "@/utils/xmtpRN/contacts";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  Dm,
  InboxId,
} from "@xmtp/react-native-sdk";

export function useDmConsentMutation(args: {
  peerInboxId: InboxId;
  conversationId: ConversationId;
  topic: ConversationTopic;
}) {
  const { peerInboxId, conversationId, topic } = args;

  // const currentInboxId = useCurrentInboxId()()!;

  return useMutation({
    mutationFn: async (args: { consent: "allow" | "deny" }) => {
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentInboxId = getCurrentInboxId();
      await Promise.all([
        consentToGroupsByGroupIds({
          inboxId: currentInboxId,
          groupIds: [conversationId],
          consent: args.consent,
        }),
        consentToInboxIdsOnProtocolByInboxId({
          inboxId: currentInboxId,
          inboxIds: [peerInboxId],
          consent: args.consent,
        }),
      ]);
    },
    onMutate: (args) => {
      const currentInboxId = getCurrentInboxId();
      const conversation = getConversationQueryData({
        inboxId: currentInboxId,
        topic,
      });
      if (conversation) {
        const updatedDm = mutateObjectProperties(conversation, {
          state: args.consent === "allow" ? "allowed" : "denied",
        });
        setDmQueryData({
          inboxId: currentInboxId,
          peer: updatedDm,
          dm: updatedDm as DmWithCodecsType,
        });
        updateConversationInConversationListQuery({
          inboxId: currentInboxId,
          topic,
          conversationUpdate: {
            state: args.consent === "allow" ? "allowed" : "denied",
          },
        });
        return { previousDmConsent: conversation.state, peer: conversation.p };
      }
    },
    onError: (error, _, context) => {
      const { previousDmConsent } = context || {};
      if (previousDmConsent) {
        const currentInboxId = getCurrentInboxId();
        const dm = getDmQueryData({
          inboxId: currentInboxId,
          peer: context.,
        });
        if (!dm) {
          return;
        }
        const updatedDm = mutateObjectProperties(dm, {
          state: previousDmConsent,
        });
        setDmQueryData({
          inboxId: currentInboxId,
          topic,
          dm: updatedDm,
        });
        updateConversationInConversationListQuery({
          inboxId: currentInboxId,
          topic,
          conversationUpdate: {
            state: previousDmConsent,
          },
        });
      }
    },
  });
}
