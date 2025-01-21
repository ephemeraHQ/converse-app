import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { getConversationQueryData } from "@/queries/useConversationQuery";
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

export function useDmConsent() {
  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async (args: {
      consent: "allow" | "deny";
      peerInboxId: InboxId;
      conversationId: ConversationId;
      topic: ConversationTopic;
    }) => {
      const { peerInboxId, conversationId, topic } = args;
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: args.consent,
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: args.consent,
        }),
      ]);
    },
    onMutate: (args) => {
      const { peerInboxId, conversationId, topic } = args;
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: args.consent === "allow" ? "allowed" : "denied",
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
            state: args.consent === "allow" ? "allowed" : "denied",
          },
        });
        return { previousDmConsent: conversation.state };
      }
    },
    onError: (error, variables, context) => {
      const { topic } = variables;
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
      }
    },
  });
}
