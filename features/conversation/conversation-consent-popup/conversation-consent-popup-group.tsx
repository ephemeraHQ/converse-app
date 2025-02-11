import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useGroupConsentForCurrentAccount } from "@/features/consent/use-group-consent-for-current-account";
import {
  ConsentPopupButtonsContainer,
  ConsentPopupTitle,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
} from "@/features/conversation/conversation-consent-popup/conversation-consent-popup.design-system";
import { useRouter } from "@/navigation/useNavigation";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";
import { captureErrorWithToast } from "@/utils/capture-error";
import { translate } from "@i18n";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import React, { useCallback } from "react";
import { useColorScheme } from "react-native";
import { useCurrentConversationTopicSafe } from "../conversation.store-context";

export function ConversationConsentPopupGroup() {
  const topic = useCurrentConversationTopicSafe();

  const navigation = useRouter();

  const colorScheme = useColorScheme();

  const { denyGroup, allowGroup } = useGroupConsentForCurrentAccount(topic);

  const account = useCurrentAccount()!;

  const { data: groupName } = useGroupNameQuery({ account, topic });

  const handleDeclineGroup = useCallback(async () => {
    groupRemoveRestoreHandler(
      "unknown", // To display "Remove & Block inviter"
      colorScheme,
      groupName,
      allowGroup,
      denyGroup
    )((success: boolean) => {
      if (success) {
        navigation.pop();
      }
      // If not successful, do nothing (user canceled)
    });
  }, [groupName, colorScheme, allowGroup, denyGroup, navigation]);

  const onAccept = useCallback(async () => {
    try {
      await allowGroup({
        includeCreator: false,
        includeAddedBy: false,
      });
    } catch (error) {
      captureErrorWithToast(error, {
        message: `Failed to allow group`,
      });
    }
  }, [allowGroup]);

  return (
    <ConversationConsentPopupContainer>
      <ConsentPopupTitle>
        {translate("do_you_want_to_join_this_group")}
      </ConsentPopupTitle>
      <ConsentPopupButtonsContainer>
        <ConversationConsentPopupButton
          variant="text"
          action="danger"
          icon="xmark"
          text={translate("decline")}
          onPress={handleDeclineGroup}
        />
        <ConversationConsentPopupButton
          variant="fill"
          icon="checkmark"
          text={translate("join_this_group")}
          onPress={onAccept}
        />
      </ConsentPopupButtonsContainer>
    </ConversationConsentPopupContainer>
  );
}
