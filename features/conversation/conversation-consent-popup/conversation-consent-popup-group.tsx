import { translate } from "@i18n"
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers"
import React, { useCallback } from "react"
import { useColorScheme } from "react-native"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useGroupConsentForCurrentAccount } from "@/features/consent/use-group-consent-for-current-account"
import {
  ConsentPopupButtonsContainer,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
  ConversationConsentPopupHelperText,
} from "@/features/conversation/conversation-consent-popup/conversation-consent-popup.design-system"
import { useRouter } from "@/navigation/use-navigation"
import { useGroupNameQuery } from "@/queries/useGroupNameQuery"
import { captureErrorWithToast } from "@/utils/capture-error"
import { useCurrentConversationTopicSafe } from "../conversation.store-context"

export function ConversationConsentPopupGroup() {
  const topic = useCurrentConversationTopicSafe()

  const navigation = useRouter()

  const colorScheme = useColorScheme()

  const { denyGroup, allowGroup } = useGroupConsentForCurrentAccount(topic)

  const account = useCurrentSenderEthAddress()!

  const { data: groupName } = useGroupNameQuery({ account, topic })

  const handleDeclineGroup = useCallback(async () => {
    groupRemoveRestoreHandler(
      "unknown", // To display "Remove & Block inviter"
      colorScheme,
      groupName,
      allowGroup,
      denyGroup,
    )((success: boolean) => {
      if (success) {
        navigation.pop()
      }
      // If not successful, do nothing (user canceled)
    })
  }, [groupName, colorScheme, allowGroup, denyGroup, navigation])

  const onAccept = useCallback(async () => {
    try {
      await allowGroup({
        includeCreator: false,
        includeAddedBy: false,
      })
    } catch (error) {
      captureErrorWithToast(error, {
        message: `Failed to allow group`,
      })
    }
  }, [allowGroup])

  return (
    <ConversationConsentPopupContainer>
      <ConsentPopupButtonsContainer>
        <ConversationConsentPopupButton
          variant="fill"
          text={translate("Join the conversation")}
          onPress={onAccept}
        />
        <ConversationConsentPopupButton
          variant="text"
          action="danger"
          text={translate("Delete")}
          onPress={handleDeclineGroup}
        />
        <ConversationConsentPopupHelperText>
          {translate("No one is notified if you delete it")}
        </ConversationConsentPopupHelperText>
      </ConsentPopupButtonsContainer>
    </ConversationConsentPopupContainer>
  )
}
