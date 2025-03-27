import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { showActionSheet } from "@/components/action-sheet"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { deleteConversationMetadata } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getGroupQueryData } from "@/features/groups/queries/group.query"
import { updateXmtpConsentForGroupsForInbox } from "@/features/xmtp/xmtp-consent/xmtp-consent"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

export const useDeleteGroup = (args: { xmtpConversationId: IXmtpConversationId }) => {
  const { xmtpConversationId } = args
  const currentSender = useSafeCurrentSender()

  const { mutateAsync: deleteGroupAsync } = useMutation({
    mutationFn: () =>
      deleteConversationMetadata({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      }),
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
    const group = getGroupQueryData({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    })

    if (!group) {
      throw new Error("Group not found")
    }

    const title = `${translate("delete_chat_with")} ${group.name}?`

    const actions = [
      {
        label: translate("delete"),
        action: async () => {
          try {
            await deleteGroupAsync()
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error deleting group" }),
            )
          }
        },
      },
      {
        label: translate("delete_and_block"),
        action: async () => {
          try {
            await deleteGroupAsync()
            await updateXmtpConsentForGroupsForInbox({
              clientInboxId: currentSender.inboxId,
              groupIds: [group.xmtpId],
              consent: "denied",
            })
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error deleting group" }),
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
          actions[selectedIndex].action()
        }
      },
    })
  }, [currentSender, xmtpConversationId, deleteGroupAsync])
}
