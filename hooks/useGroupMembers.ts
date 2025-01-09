import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentInboxId } from "../data/store/accountsStore";
import { useAddToGroupMutation } from "../queries/useAddToGroupMutation";
import { useGroupMembersQuery } from "../queries/useGroupMembersQuery";
import { usePromoteToAdminMutation } from "../queries/usePromoteToAdminMutation";
import { usePromoteToSuperAdminMutation } from "../queries/usePromoteToSuperAdminMutation";
import { useRemoveFromGroupMutation } from "../queries/useRemoveFromGroupMutation";
import { useRevokeAdminMutation } from "../queries/useRevokeAdminMutation";
import { useRevokeSuperAdminMutation } from "../queries/useRevokeSuperAdminMutation";

export const useGroupMembers = (args: { topic: ConversationTopic }) => {
  const { topic } = args;
  const inboxId = useCurrentInboxId()!;

  const {
    data: members,
    isLoading,
    isError,
  } = useGroupMembersQuery({
    inboxId,
    topic,
  });
  const { mutateAsync: promoteToAdmin } = usePromoteToAdminMutation({
    inboxId,
    topic,
  });
  const { mutateAsync: promoteToSuperAdmin } = usePromoteToSuperAdminMutation({
    inboxId,
    topic,
  });
  const { mutateAsync: revokeSuperAdmin } = useRevokeSuperAdminMutation({
    inboxId,
    topic,
  });

  const { mutateAsync: revokeAdmin } = useRevokeAdminMutation({
    inboxId,
    topic,
  });

  const { mutateAsync: removeMember } = useRemoveFromGroupMutation({
    inboxId,
    topic,
  });

  const { mutateAsync: addMembers } = useAddToGroupMutation({
    inboxId,
    topic,
  });

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
