import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { getCurrentInboxId } from "../data/store/accountsStore";
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery";

export const useGroupPermissionspForCurrentUser = ({
  topic,
}: {
  topic: ConversationTopic;
}) => {
  const inboxId = getCurrentInboxId()!;
  const {
    data: permissions,
    isLoading,
    isError,
  } = useGroupPermissionsQuery({ inboxId, topic });

  return {
    permissions,
    isLoading,
    isError,
  };
};
