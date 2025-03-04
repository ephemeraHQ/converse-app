import { useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useConversationIsDeleted(args: { conversationTopic: ConversationTopic }) {
  const { conversationTopic } = args

  const currentAccount = useCurrentSenderEthAddress()

  const { data: isDeleted } = useQuery({
    ...getConversationMetadataQueryOptions({
      account: currentAccount!,
      topic: conversationTopic,
    }),
    select: (data) => data?.deleted,
  })

  return {
    isDeleted,
  }
}
