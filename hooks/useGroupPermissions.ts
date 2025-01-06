import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery";

export const useGroupPermissions = (topic: ConversationTopic | undefined) => {
  const inboxId = getCurrentInboxId();
  const {
    data: permissions,
    isLoading,
    isError,
  } = useGroupPermissionsQuery(account, topic!);

  return {
    permissions,
    isLoading,
    isError,
  };
};
