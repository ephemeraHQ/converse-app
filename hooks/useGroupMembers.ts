import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useAddToGroupMutation } from "../queries/useAddToGroupMutation";
import { useGroupMembersQuery } from "../queries/useGroupMembersQuery";
import { usePromoteToAdminMutation } from "../queries/usePromoteToAdminMutation";
import { usePromoteToSuperAdminMutation } from "../queries/usePromoteToSuperAdminMutation";
import { useRemoveFromGroupMutation } from "../queries/useRemoveFromGroupMutation";
import { useRevokeAdminMutation } from "../queries/useRevokeAdminMutation";
import { useRevokeSuperAdminMutation } from "../queries/useRevokeSuperAdminMutation";

export const useGroupMembers = (topic: ConversationTopic) => {
  const account = currentAccount();

  const {
    data: members,
    isLoading,
    isError,
  } = useGroupMembersQuery({
    account,
    topic,
  });
  const { mutateAsync: promoteToAdmin } = usePromoteToAdminMutation(
    account,
    topic
  );
  const { mutateAsync: promoteToSuperAdmin } = usePromoteToSuperAdminMutation(
    account,
    topic
  );
  const { mutateAsync: revokeSuperAdmin } = useRevokeSuperAdminMutation(
    account,
    topic
  );

  const { mutateAsync: revokeAdmin } = useRevokeAdminMutation(account, topic);

  const { mutateAsync: removeMember } = useRemoveFromGroupMutation(
    account,
    topic
  );

  const { mutateAsync: addMembers } = useAddToGroupMutation(account, topic);

  return {
    members,
    isLoading,
    isError,
    promoteToAdmin,
    promoteToSuperAdmin,
    revokeSuperAdmin,
    revokeAdmin,
    removeMember,
    addMembers,
  };
};
