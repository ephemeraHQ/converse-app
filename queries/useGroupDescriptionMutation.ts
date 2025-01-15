import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupDescriptionMutationKey } from "./MutationKeys";
import { updateConversationInConversationsQuery } from "@/queries/conversations-query";
import { userCanDoGroupActions } from "@/utils/groupUtils/userCanDoGroupActions";
import { useGroupPermissionPolicyQuery } from "./useGroupPermissionPolicyQuery";
import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
} from "@/utils/groupUtils/adminUtils";
import { useGroupMembersQuery } from "./useGroupMembersQuery";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

const useGroupMemberPermissions = ({
  currentAccount,
  groupTopic,
}: {
  currentAccount: string;
  groupTopic: ConversationTopic;
}) => {
  const { data: groupPermissionPolicy } = useGroupPermissionPolicyQuery(
    currentAccount,
    groupTopic
  );
  const { data: members } = useGroupMembersQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  const isSuperAdmin = getAccountIsSuperAdmin(members, currentAccount);
  const isAdmin = getAccountIsAdmin(members, currentAccount);
};

export function useGroupDescriptionMutation(args: IArgs) {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });
  const { data: groupPermissionPolicy } = useGroupPermissionPolicyQuery(
    account,
    topic
  );

  const {
    canUpdateGroupName,
    canUpdateGroupDescription,
    canUpdateGroupPhoto,

    canUpdateAdminUsers,
    canUpdateSuperAdminUsers,
  } = /*todo*/ useGroupMemberPermissions({
    currentAccount: account,
    groupTopic: topic,
  });

  return useMutation({
    mutationKey: setGroupDescriptionMutationKey(account, topic),
    mutationFn: async (description: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupDescriptionMutation");
      }

      await group.updateGroupDescription(description);
      return description;
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      const updates = { description };

      if (previousGroup) {
        updateGroupQueryData({ account, topic, updates });
      }

      updateConversationInConversationsQuery({
        account,
        topic,
        conversationUpdate: updates,
      });

      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      const { previousGroup } = context || {};

      const updates = { description: previousGroup?.description ?? "" };
      updateGroupQueryData({ account, topic, updates });
      updateConversationInConversationsQuery({
        account,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
