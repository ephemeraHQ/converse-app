import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/queries/unknown-consent-conversations-query";
import {
  addConversationToConversationsQuery,
  removeConversationFromConversationsQuery,
} from "@/queries/use-conversations-query";
import {
  getGroupQueryData,
  getOrFetchGroupQuery,
  setGroupQueryData,
} from "@/queries/useGroupQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryClient } from "@queries/queryClient";
import {
  MutationObserver,
  MutationOptions,
  useMutation,
} from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { MutationKeys } from "../../queries/MutationKeys";
import { updateConsentForGroupsForAccount } from "./update-consent-for-groups-for-account";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";

type IAllowGroupMutationOptions = {
  account: string;
  topic: ConversationTopic;
};

type IAllowGroupReturnType = Awaited<ReturnType<typeof allowGroup>>;

type IAllowGroupArgs = {
  includeAddedBy?: boolean;
  includeCreator?: boolean;
  account: string;
  topic: ConversationTopic;
};

async function allowGroup({
  includeAddedBy,
  includeCreator,
  account,
  topic,
}: IAllowGroupArgs) {
  const group = await getOrFetchGroupQuery({
    account,
    topic,
    caller: "allowGroup",
  });

  if (!group) {
    throw new Error("Group not found");
  }

  if (!isConversationGroup(group)) {
    throw new Error("Group is not a valid group");
  }

  const groupTopic = group.topic;
  const groupCreator = await group.creatorInboxId();

  const inboxIdsToAllow: InboxId[] = [];
  if (includeAddedBy && group?.addedByInboxId) {
    inboxIdsToAllow.push(group.addedByInboxId);
  }

  if (includeCreator && groupCreator) {
    inboxIdsToAllow.push(groupCreator);
  }

  await Promise.all([
    updateConsentForGroupsForAccount({
      account,
      groupIds: [getV3IdFromTopic(groupTopic)],
      consent: "allow",
    }),
    ...(inboxIdsToAllow.length > 0
      ? [
          updateInboxIdsConsentForAccount({
            account,
            inboxIds: inboxIdsToAllow,
            consent: "allow",
          }),
        ]
      : []),
  ]);

  return "allowed" as const;
}

export const getAllowGroupMutationOptions = (
  args: IAllowGroupMutationOptions
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  IAllowGroupArgs,
  { previousGroup: GroupWithCodecsType } | undefined
> => {
  const { account, topic } = args;
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: allowGroup,
    onMutate: async (args) => {
      const { account } = args;

      const previousGroup = getGroupQueryData({ account, topic });

      if (!previousGroup) {
        throw new Error("Previous group not found");
      }

      const updatedGroup = updateObjectAndMethods(previousGroup, {
        state: "allowed",
      });

      setGroupQueryData({ account, topic, group: updatedGroup });

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        account,
        topic,
      });

      // Add to main conversations list
      addConversationToConversationsQuery({
        account,
        conversation: updatedGroup,
      });

      return { previousGroup };
    },
    onError: (_, variables, context) => {
      if (!context) {
        return;
      }

      const { account, topic } = variables;

      setGroupQueryData({
        account,
        topic,
        group: context.previousGroup,
      });

      // Add back in requests
      addConversationToUnknownConsentConversationsQuery({
        account,
        conversation: context.previousGroup,
      });

      // Remove from main conversations list
      removeConversationFromConversationsQuery({
        account,
        topic,
      });
    },
  };
};

export const createAllowGroupMutationObserver = (
  args: IAllowGroupMutationOptions
) => {
  const allowGroupMutationObserver = new MutationObserver(
    queryClient,
    getAllowGroupMutationOptions(args)
  );
  return allowGroupMutationObserver;
};

export const useAllowGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  return useMutation(getAllowGroupMutationOptions({ account, topic }));
};
