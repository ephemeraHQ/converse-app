import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../features/multi-inbox/multi-inbox.store";
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery";

export const useGroupPermissions = (topic: ConversationTopic) => {
  const account = currentAccount();
  const {
    data: permissions,
    isLoading,
    isError,
  } = useGroupPermissionsQuery(account, topic);

  return {
    permissions,
    isLoading,
    isError,
  };
};
