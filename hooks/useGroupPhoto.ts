import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCurrentSenderEthAddress } from "../features/authentication/multi-inbox.store"
import { useGroupPhotoMutation } from "../queries/useGroupPhotoMutation"
import { useGroupPhotoQuery } from "../queries/useGroupPhotoQuery"

export const useGroupPhoto = (topic: ConversationTopic) => {
  const account = useCurrentSenderEthAddress()
  const { data, isLoading, isError } = useGroupPhotoQuery({
    account: account ?? "",
    topic,
  })
  const { mutateAsync } = useGroupPhotoMutation({
    account: account ?? "",
    topic,
  })

  return {
    groupPhoto: data,
    isLoading,
    isError,
    setGroupPhoto: mutateAsync,
  }
}
