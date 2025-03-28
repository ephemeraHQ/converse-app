import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { showActionSheet } from "@/components/action-sheet"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useDenyDmMutation } from "@/features/consent/use-deny-dm.mutation"
import { deleteConversationMetadata } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { useDmQuery } from "@/features/dm/dm.query"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

export const useDeleteDm = ({
  xmtpConversationId,
}: {
  xmtpConversationId: IXmtpConversationId
}) => {
  const currentSender = useSafeCurrentSender()!

  const { data: dm } = useDmQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { displayName } = usePreferredDisplayInfo({
    inboxId: dm?.peerInboxId!,
  })

  const { mutateAsync: denyDmConsentAsync } = useDenyDmMutation()

  const { mutateAsync: deleteDmAsync } = useMutation({
    mutationFn: () =>
      deleteConversationMetadata({ clientInboxId: currentSender.inboxId, xmtpConversationId }),
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })?.deleted

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        updateData: { deleted: true },
      })

      return { previousDeleted }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        updateData: { deleted: context?.previousDeleted },
      })
    },
  })

  return useCallback(() => {
    const title = `${translate("delete_chat_with")} ${displayName}?`

    if (!xmtpConversationId) {
      throw new Error("Conversation not found in useDeleteDm")
    }

    if (!dm?.peerInboxId) {
      throw new Error("Peer inbox id not found in useDeleteDm")
    }

    const actions = [
      {
        label: translate("delete"),
        action: async () => {
          try {
            await deleteDmAsync()
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error deleting dm" }),
            )
          }
        },
      },
      {
        label: translate("delete_and_block"),
        action: async () => {
          try {
            await deleteDmAsync()
            await denyDmConsentAsync({
              peerInboxId: dm.peerInboxId,
              xmtpConversationId,
            })
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error deleting dm" }),
            )
          }
        },
      },
      {
        label: translate("Cancel"),
        action: () => {},
      },
    ]

    showActionSheet({
      options: {
        options: actions.map((a) => a.label),
        cancelButtonIndex: actions.length - 1,
        destructiveButtonIndex: [0, 1],
        title,
      },
      callback: async (selectedIndex?: number) => {
        if (selectedIndex !== undefined) {
          await actions[selectedIndex].action()
        }
      },
    })
  }, [displayName, deleteDmAsync, denyDmConsentAsync, dm?.peerInboxId, xmtpConversationId])
}
