import { useMutation, useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import { showActionSheet } from "@/components/action-sheet"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useDenyDmMutation } from "@/features/consent/use-deny-dm.mutation"
import { deleteConversation } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryOptions } from "@/features/conversation/conversation-query"
import { useDmPeerInboxIdQuery } from "@/features/dm/use-dm-peer-inbox-id-query"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { translate } from "@/i18n"
import { captureErrorWithToast } from "@/utils/capture-error"

export const useDeleteDm = ({ topic }: { topic: ConversationTopic }) => {
  const currentAccount = useCurrentSenderEthAddress()!

  const { data: conversationId } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount,
      topic,
    }),
    select: (conversation) => conversation?.id,
  })

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount,
    topic,
    caller: "useDeleteDm",
  })

  const { displayName } = usePreferredDisplayInfo({
    inboxId: peerInboxId!,
  })

  const { mutateAsync: denyDmConsentAsync } = useDenyDmMutation()

  const { mutateAsync: deleteDmAsync } = useMutation({
    mutationFn: () => deleteConversation({ account: currentAccount, topic }),
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      })?.deleted

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { deleted: true },
      })

      return { previousDeleted }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { deleted: context?.previousDeleted },
      })
    },
  })

  return useCallback(() => {
    const title = `${translate("delete_chat_with")} ${displayName}?`

    if (!conversationId) {
      throw new Error("Conversation not found in useDeleteDm")
    }

    if (!peerInboxId) {
      throw new Error("Peer inbox id not found in useDeleteDm")
    }

    const actions = [
      {
        label: translate("delete"),
        action: async () => {
          try {
            await deleteDmAsync()
          } catch (error) {
            captureErrorWithToast(error)
          }
        },
      },
      {
        label: translate("delete_and_block"),
        action: async () => {
          try {
            await deleteDmAsync()
            await denyDmConsentAsync({
              peerInboxId: peerInboxId,
              conversationId,
              topic,
            })
          } catch (error) {
            captureErrorWithToast(error)
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
  }, [displayName, deleteDmAsync, denyDmConsentAsync, peerInboxId, conversationId, topic])
}
