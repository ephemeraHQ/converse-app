import { currentAccount } from "../data/store/accountsStore";
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupPermissions = (topic: ConversationTopic | undefined) => {
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
