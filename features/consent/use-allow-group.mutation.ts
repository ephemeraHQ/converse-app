import { MutationObserver, MutationOptions, useMutation } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getConversationIdFromTopic } from "@/features/conversation/utils/get-conversation-id-from-topic"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import {
  getGroupQueryData,
  getOrFetchGroupQuery,
  setGroupQueryData,
} from "@/features/groups/useGroupQuery"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  setXmtpConsentStateForInboxId,
  updateConsentForGroupsForAccount,
} from "../xmtp/xmtp-consent/xmtp-consent"

type IAllowGroupMutationOptions = {
  clientInboxId: InboxId
  topic: ConversationTopic
}

type IAllowGroupReturnType = Awaited<ReturnType<typeof allowGroup>>

type IAllowGroupArgs = {
  includeAddedBy?: boolean
  includeCreator?: boolean
  clientInboxId: InboxId
  topic: ConversationTopic
}

async function allowGroup({
  includeAddedBy,
  includeCreator,
  clientInboxId,
  topic,
}: IAllowGroupArgs) {
  const group = await getOrFetchGroupQuery({
    inboxId: getSafeCurrentSender().inboxId,
    topic,
    caller: "allowGroup",
  })

  if (!group) {
    throw new Error("Group not found")
  }

  if (!isConversationGroup(group)) {
    throw new Error("Group is not a valid group")
  }

  const groupTopic = group.topic
  const groupCreator = await group.creatorInboxId()

  const inboxIdsToAllow: InboxId[] = []
  if (includeAddedBy && group?.addedByInboxId) {
    inboxIdsToAllow.push(group.addedByInboxId)
  }

  if (includeCreator && groupCreator) {
    inboxIdsToAllow.push(groupCreator)
  }

  await Promise.all([
    updateConsentForGroupsForAccount({
      clientInboxId,
      groupIds: [getConversationIdFromTopic(groupTopic)],
      consent: "allowed",
    }),
    ...(inboxIdsToAllow.length > 0
      ? [
          setXmtpConsentStateForInboxId({
            inboxId: clientInboxId,
            consent: "allowed",
          }),
        ]
      : []),
  ])

  return "allowed" as const
}

export const getAllowGroupMutationOptions = (
  args: IAllowGroupMutationOptions,
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  IAllowGroupArgs,
  { previousGroup: IXmtpGroupWithCodecs } | undefined
> => {
  const { topic } = args

  return {
    mutationFn: allowGroup,
    onMutate: async (args) => {
      const { clientInboxId } = args

      const previousGroup = getGroupQueryData({ inboxId: clientInboxId, topic })

      if (!previousGroup) {
        throw new Error("Previous group not found")
      }

      const updatedGroup = updateObjectAndMethods(previousGroup, {
        state: "allowed",
      })

      setGroupQueryData({ inboxId: clientInboxId, topic, group: updatedGroup })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
      })

      // Add to main conversations list
      addConversationToAllowedConsentConversationsQuery({
        inboxId: clientInboxId,
        conversation: updatedGroup,
      })

      return { previousGroup }
    },
    onError: (_, variables, context) => {
      if (!context) {
        return
      }

      const { clientInboxId, topic } = variables

      setGroupQueryData({
        inboxId: clientInboxId,
        topic,
        group: context.previousGroup,
      })

      // Add back in requests
      addConversationToUnknownConsentConversationsQuery({
        inboxId: clientInboxId,
        conversation: context.previousGroup,
      })

      // Remove from main conversations list
      removeConversationFromAllowedConsentConversationsQuery({
        inboxId: clientInboxId,
        topic,
      })
    },
  }
}

export const createAllowGroupMutationObserver = (args: IAllowGroupMutationOptions) => {
  const allowGroupMutationObserver = new MutationObserver(
    reactQueryClient,
    getAllowGroupMutationOptions(args),
  )
  return allowGroupMutationObserver
}

export const useAllowGroupMutation = (args: IAllowGroupMutationOptions) => {
  return useMutation(getAllowGroupMutationOptions(args))
}
