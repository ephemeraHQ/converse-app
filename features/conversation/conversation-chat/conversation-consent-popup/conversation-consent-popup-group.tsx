import { translate } from "@i18n"
import React, { useCallback } from "react"
import { useColorScheme } from "react-native"
import { useGroupConsentForCurrentSender } from "@/features/consent/use-group-consent-for-current-sender"
import {
  ConsentPopupButtonsContainer,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
  ConversationConsentPopupHelperText,
} from "@/features/conversation/conversation-chat/conversation-consent-popup/conversation-consent-popup.design-system"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { groupRemoveRestoreHandler } from "@/features/groups/utils/groupActionHandlers"
import { useRouter } from "@/navigation/use-navigation"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { useCurrentXmtpConversationIdSafe } from "../conversation.store-context"

export function ConversationConsentPopupGroup() {
  const xmtpConversationId = useCurrentXmtpConversationIdSafe()

  const navigation = useRouter()

  const colorScheme = useColorScheme()

  const { denyGroup, allowGroup } = useGroupConsentForCurrentSender({ xmtpConversationId })

  const { groupName } = useGroupName({ xmtpConversationId })

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
      captureErrorWithToast(new GenericError({ error, additionalMessage: `Failed to allow group` }))
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
