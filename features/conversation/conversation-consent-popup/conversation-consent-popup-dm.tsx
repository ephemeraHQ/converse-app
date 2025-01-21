import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { useDmConsent } from "@/features/consent/use-dm-consent";
import { useRouter } from "@/navigation/useNavigation";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { actionSheetColors } from "@/styles/colors";
import { captureErrorWithToast } from "@/utils/capture-error";
import { ensureError } from "@/utils/error";
import { translate } from "@i18n";
import React, { useCallback } from "react";
import { useColorScheme } from "react-native";
import {
  useConversationCurrentConversationId,
  useCurrentConversationTopic,
} from "../conversation.store-context";
import {
  ConsentPopupButtonsContainer,
  ConsentPopupTitle,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
} from "./conversation-consent-popup.design-system";

export function ConversationConsentPopupDm() {
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
  } = useDmConsent();

  const handleBlock = useCallback(async () => {
    if (!peerInboxId) {
      throw new Error("Peer inbox id not found");
    }

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
              topic,
              consent: "deny",
              peerInboxId: peerInboxId,
              conversationId: conversationId,
            });
            navigation.pop();
          } catch (error) {
            captureErrorWithToast(ensureError(error), {
              message: `Error consenting`,
            });
          }
        }
      }
    );
  }, [
    colorScheme,
    navigation,
    consentToInboxIdsOnProtocolByAccountAsync,
    peerInboxId,
    conversationId,
    topic,
  ]);

  const handleAccept = useCallback(async () => {
    try {
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      await consentToInboxIdsOnProtocolByAccountAsync({
        consent: "allow",
        peerInboxId,
        conversationId,
        topic,
      });
    } catch (error) {
      captureErrorWithToast(ensureError(error), {
        message: `Error consenting`,
      });
    }
  }, [
    consentToInboxIdsOnProtocolByAccountAsync,
    peerInboxId,
    conversationId,
    topic,
  ]);

  // UX to show instant feedback to the user. When they click, we remove the popup to show that the action was done instant.
  // If there was an error, the popup will show back and we'll show a snackbar with the error message.
  if (
    consentToInboxIdsOnProtocolByAccountStatus === "success" ||
    consentToInboxIdsOnProtocolByAccountStatus === "pending"
  ) {
    return null;
  }

  return (
    <ConversationConsentPopupContainer>
      <ConsentPopupTitle>
        {translate("do_you_trust_this_contact")}
      </ConsentPopupTitle>
      <ConsentPopupButtonsContainer>
        <ConversationConsentPopupButton
          variant="text"
          action="danger"
          icon="xmark"
          text={translate("block")}
          onPress={handleBlock}
        />
        <ConversationConsentPopupButton
          variant="fill"
          icon="checkmark"
          text={translate("accept")}
          onPress={handleAccept}
        />
      </ConsentPopupButtonsContainer>
    </ConversationConsentPopupContainer>
  );
}
