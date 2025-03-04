import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery"

export const useGroupPermissions = (topic: ConversationTopic) => {
  const account = getSafeCurrentSender().ethereumAddress
  const { data: permissions, isLoading, isError } = useGroupPermissionsQuery(account, topic)

  return {
    permissions,
    isLoading,
    isError,
  }
}
