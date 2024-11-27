import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { useRouter } from "@/navigation/useNavigation";
import { refetchConversationQuery } from "@/queries/useConversationQuery";
import { actionSheetColors } from "@/styles/colors";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ensureError } from "@/utils/error";
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
  ConsentPopupButton,
  ConsentPopupButtonsContainer,
  ConsentPopupContainer,
  ConsentPopupTitle,
} from "./consent-popup.design-system";

type ConsentPopupProps = {
  peerInboxId: InboxId;
  topic: ConversationTopic;
  conversationId: ConversationId;
};

export function DmConsentPopup({
  peerInboxId,
  topic,
  conversationId,
}: ConsentPopupProps) {
  const navigation = useRouter();

  const colorScheme = useColorScheme();

  const {
    mutateAsync: consentToInboxIdsOnProtocolByAccountAsync,
    status: consentToInboxIdsOnProtocolByAccountStatus,
  } = useMutation({
    mutationFn: async (args: { consent: "allow" | "deny" }) => {
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
    onSuccess: () => {
      refetchConversationQuery(getCurrentAccount()!, topic);
    },
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
