import {
  ConsentPopupButton,
  ConsentPopupButtonsContainer,
  ConsentPopupContainer,
  ConsentPopupTitle,
} from "@/components/Chat/ConsentPopup/consent-popup.design-system";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { useRouter } from "@/navigation/useNavigation";
import { getGroupNameQueryData } from "@/queries/useGroupNameQuery";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { useCallback } from "react";
import { useColorScheme } from "react-native";

export function GroupConsentPopup(props: { topic: ConversationTopic }) {
  const { topic } = props;

  const navigation = useRouter();

  const currentAccount = useCurrentAccount()!;

  const colorScheme = useColorScheme();

  const { blockGroup, allowGroup } = useGroupConsent(topic);

  const groupName = getGroupNameQueryData(currentAccount, topic);

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
