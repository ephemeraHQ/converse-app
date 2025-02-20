import { showActionSheet } from "@/components/action-sheet";
import { useAllowDmMutation } from "@/features/consent/use-allow-dm.mutation";
import { useDenyDmMutation } from "@/features/consent/use-deny-dm.mutation";
import { useCurrentSenderEthAddress } from "@/features/multi-inbox/multi-inbox.store";
import { useRouter } from "@/navigation/use-navigation";
import { getConversationQueryData } from "@/queries/conversation-query";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { captureErrorWithToast } from "@/utils/capture-error";
import { ensureError } from "@/utils/error";
import { translate } from "@i18n";
import React, { useCallback } from "react";
import { useCurrentConversationTopicSafe } from "../conversation.store-context";
import {
  ConsentPopupButtonsContainer,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
  ConversationConsentPopupHelperText,
} from "./conversation-consent-popup.design-system";

export function ConversationConsentPopupDm() {
  const topic = useCurrentConversationTopicSafe();
  const currentAccount = useCurrentSenderEthAddress()!;

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount,
    topic,
    caller: "ConversationConsentPopupDm",
  });

  const navigation = useRouter();

  const { mutateAsync: denyDmConsentAsync } = useDenyDmMutation();
  const { mutateAsync: allowDmConsentAsync } = useAllowDmMutation();

  const handleBlock = useCallback(async () => {
    if (!peerInboxId) {
      throw new Error("Peer inbox id not found");
    }

    const conversation = getConversationQueryData({
      account: currentAccount,
      topic,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    showActionSheet({
      options: {
        options: [translate("Delete"), translate("Cancel")],
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        title: translate("if_you_block_contact"),
      },
      callback: async (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          try {
            await denyDmConsentAsync({
              topic,
              peerInboxId: peerInboxId,
              conversationId: conversation.id,
            });
            navigation.pop();
          } catch (error) {
            captureErrorWithToast(ensureError(error), {
              message: `Error consenting`,
            });
          }
        }
      },
    });
  }, [navigation, denyDmConsentAsync, peerInboxId, topic, currentAccount]);

  const handleAccept = useCallback(async () => {
    try {
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }

      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      await allowDmConsentAsync({
        peerInboxId,
        conversationId: conversation.id,
        topic,
      });
    } catch (error) {
      captureErrorWithToast(ensureError(error), {
        message: `Error consenting`,
      });
    }
  }, [allowDmConsentAsync, peerInboxId, topic, currentAccount]);

  return (
    <ConversationConsentPopupContainer>
      <ConsentPopupButtonsContainer>
        <ConversationConsentPopupButton
          variant="fill"
          text={translate("Join the conversation")}
          onPress={handleAccept}
        />
        <ConversationConsentPopupButton
          variant="text"
          action="danger"
          text={translate("Delete")}
          onPress={handleBlock}
        />
        <ConversationConsentPopupHelperText>
          {translate("They won't be notified if you delete it")}
        </ConversationConsentPopupHelperText>
      </ConsentPopupButtonsContainer>
    </ConversationConsentPopupContainer>
  );
}
