import { translate } from "@i18n"
import React, { useCallback } from "react"
import { showActionSheet } from "@/components/action-sheet"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowDmMutation } from "@/features/consent/use-allow-dm.mutation"
import { useDenyDmMutation } from "@/features/consent/use-deny-dm.mutation"
import { useDmQuery } from "@/features/dm/dm.query"
import { useRouter } from "@/navigation/use-navigation"
import { captureErrorWithToast } from "@/utils/capture-error"
import { ensureError } from "@/utils/error"
import { useCurrentXmtpConversationIdSafe } from "../conversation.store-context"
import {
  ConsentPopupButtonsContainer,
  ConversationConsentPopupButton,
  ConversationConsentPopupContainer,
  ConversationConsentPopupHelperText,
} from "./conversation-consent-popup.design-system"

export function ConversationConsentPopupDm() {
  const xmtpConversationId = useCurrentXmtpConversationIdSafe()
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const { data: dm } = useDmQuery({
    clientInboxId: currentSenderInboxId,
    xmtpConversationId,
  })

  const navigation = useRouter()

  const { mutateAsync: denyDmConsentAsync } = useDenyDmMutation()
  const { mutateAsync: allowDmConsentAsync } = useAllowDmMutation()

  const handleBlock = useCallback(async () => {
    if (!dm) {
      throw new Error("Dm not found")
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
              xmtpConversationId,
              peerInboxId: dm.peerInboxId,
            })
            navigation.pop()
          } catch (error) {
            captureErrorWithToast(ensureError(error), {
              message: `Error consenting`,
            })
          }
        }
      },
    })
  }, [navigation, denyDmConsentAsync, dm, xmtpConversationId])

  const handleAccept = useCallback(async () => {
    try {
      if (!dm) {
        throw new Error("Dm not found")
      }

      await allowDmConsentAsync({
        xmtpConversationId,
      })
    } catch (error) {
      captureErrorWithToast(ensureError(error), {
        message: `Error consenting`,
      })
    }
  }, [allowDmConsentAsync, dm, xmtpConversationId])

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
  )
}
