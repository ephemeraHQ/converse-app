import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { useRouter } from "@/navigation/useNavigation";
import { updateConversationInConversationsQuery } from "@/queries/conversations-query";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { actionSheetColors } from "@/styles/colors";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ensureError } from "@/utils/error";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import {
  consentToGroupsOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "@/utils/xmtpRN/contacts";
import { translate } from "@i18n";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import React, { useCallback } from "react";
import { useColorScheme } from "react-native";
import {
  useConversationCurrentConversationId,
  useCurrentConversationTopic,
} from "../conversation.store-context";
import {
  ConsentPopupButton,
  ConsentPopupButtonsContainer,
  ConsentPopupContainer,
  ConsentPopupTitle,
} from "./conversation-consent-popup.design-system";

export function DmConsentPopup() {
  const topic = useCurrentConversationTopic();
  const conversationId = useConversationCurrentConversationId();
  const currentAccount = useCurrentAccount()!;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount,
    topic,
  });

  const navigation = useRouter();

  const colorScheme = useColorScheme();

  const {
    mutateAsync: consentToInboxIdsOnProtocolByAccountAsync,
    status: consentToInboxIdsOnProtocolByAccountStatus,
  } = useDmConsent({
    peerInboxId: peerInboxId!,
    conversationId: conversationId!,
    topic: topic!,
  });

  const handleBlock = useCallback(async () => {
    showActionSheetWithOptions(
      {
        options: [translate("block"), translate("cancel")],
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        title: translate("if_you_block_contact"),
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          try {
            await consentToInboxIdsOnProtocolByAccountAsync({
              consent: "deny",
            });
            navigation.pop();
          } catch (error) {
            captureError(error);
            showSnackbar({
              type: "error",
              message: `Error consenting`,
            });
          }
        }
      }
    );
  }, [colorScheme, navigation, consentToInboxIdsOnProtocolByAccountAsync]);

  const handleAccept = useCallback(async () => {
    try {
      await consentToInboxIdsOnProtocolByAccountAsync({
        consent: "allow",
      });
    } catch (error) {
      captureErrorWithToast(ensureError(error), {
        message: `Error consenting`,
      });
    }
  }, [consentToInboxIdsOnProtocolByAccountAsync]);

  // UX to show instant feedback to the user. When they click, we remove the popup to show that the action was done instant.
  // If there was an error, the popup will show back and we'll show a snackbar with the error message.
  if (
    consentToInboxIdsOnProtocolByAccountStatus === "success" ||
    consentToInboxIdsOnProtocolByAccountStatus === "pending"
  ) {
    return null;
  }

  return (
    <ConsentPopupContainer>
      <ConsentPopupTitle>
        {translate("do_you_trust_this_contact")}
      </ConsentPopupTitle>
      <ConsentPopupButtonsContainer>
        <ConsentPopupButton
          variant="text"
          action="danger"
          icon="xmark"
          text={translate("block")}
          onPress={handleBlock}
        />
        <ConsentPopupButton
          variant="fill"
          icon="checkmark"
          text={translate("accept")}
          onPress={handleAccept}
        />
      </ConsentPopupButtonsContainer>
    </ConsentPopupContainer>
  );
}

function useDmConsent(args: {
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
      // await Promise.all([
      //   consentToGroupsOnProtocolByAccount({
      //     account: currentAccount,
      //     groupIds: [conversationId],
      //     consent: args.consent,
      //   }),
      //   consentToInboxIdsOnProtocolByAccount({
      //     account: currentAccount,
      //     inboxIds: [peerInboxId],
      //     consent: args.consent,
      //   }),
      // ]);
    },
    onMutate: (args) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
        context: "useDmConsentMutation",
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

        updateConversationInConversationsQuery({
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
        updateConversationInConversationsQuery({
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
