import { useCurrentAccount } from "@/data/store/accountsStore";
import {
  ConsentPopupButton,
  ConsentPopupButtonsContainer,
  ConsentPopupContainer,
  ConsentPopupTitle,
} from "@/features/conversation/conversation-consent-popup/conversation-consent-popup.design-system";
import { useRouter } from "@/navigation/useNavigation";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import React, { useCallback } from "react";
import { useColorScheme } from "react-native";
import { useCurrentConversationTopic } from "../conversation.store-context";

export function GroupConsentPopup() {
  const topic = useCurrentConversationTopic();

  const navigation = useRouter();

  const colorScheme = useColorScheme();

  const { blockGroup, allowGroup } = useGroupConsent(topic);

  const account = useCurrentAccount()!;

  const { data: groupName } = useGroupNameQuery({ account, topic });

  const onBlock = useCallback(async () => {
    groupRemoveRestoreHandler(
      "unknown", // To display "Remove & Block inviter"
      colorScheme,
      groupName,
      allowGroup,
      blockGroup
    )((success: boolean) => {
      if (success) {
        navigation.pop();
      }
      // If not successful, do nothing (user canceled)
    });
  }, [groupName, colorScheme, allowGroup, blockGroup, navigation]);

  const onAccept = useCallback(async () => {
    try {
      await allowGroup({
        includeCreator: false,
        includeAddedBy: false,
      });
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [allowGroup]);

  return (
    <ConsentPopupContainer>
      <ConsentPopupTitle>
        {translate("do_you_want_to_join_this_group")}
      </ConsentPopupTitle>
      <ConsentPopupButtonsContainer>
        <ConsentPopupButton
          variant="text"
          action="danger"
          icon="xmark"
          text={translate("decline")}
          onPress={onBlock}
        />
        <ConsentPopupButton
          variant="fill"
          icon="checkmark"
          text={translate("join_this_group")}
          onPress={onAccept}
        />
      </ConsentPopupButtonsContainer>
    </ConsentPopupContainer>
  );
}
