import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";
import { captureError } from "@/utils/capture-error";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { queryClient } from "@queries/queryClient";
import {
  MutationObserver,
  MutationOptions,
  useMutation,
} from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import {
  consentToGroupsOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "@utils/xmtpRN/contacts";
import {
  ConsentState,
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { MutationKeys } from "./MutationKeys";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export type AllowGroupMutationProps = {
  account: string;
  topic: ConversationTopic;
  groupId: ConversationId;
};

export type AllowGroupMutationVariables = {
  includeAddedBy?: boolean;
  includeCreator?: boolean;
  group: GroupWithCodecsType;
  account: string;
};

export type IUseAllowGroupMutationOptions = MutationOptions<
  string,
  unknown,
  AllowGroupMutationVariables,
  {
    previousConsent: ConsentState | undefined;
  }
>;

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): IUseAllowGroupMutationOptions => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: async (args: AllowGroupMutationVariables) => {
      const { includeAddedBy, includeCreator, group, account } = args;

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
        consentToGroupsOnProtocolByAccount({
          account,
          groupIds: [getV3IdFromTopic(groupTopic)],
          consent: "allow",
        }),
        ...(inboxIdsToAllow.length > 0
          ? [
              consentToInboxIdsOnProtocolByAccount({
                account,
                inboxIds: inboxIdsToAllow,
                consent: "allow",
              }),
            ]
          : []),
      ]);

      return "allowed";
    },
    onMutate: (args: AllowGroupMutationVariables) => {
      const { account, group } = args;
      const previousConsent = getGroupConsentQueryData(account, group.topic);
      setGroupConsentQueryData(account, group.topic, "allowed");
      updateConversationInConversationListQuery({
        account,
        topic: group.topic,
        conversationUpdate: {
          state: "allowed",
        },
      });
      return {
        previousConsent,
      };
    },
    onError: (
      error: unknown,
      variables: AllowGroupMutationVariables,
      context?: {
        previousConsent: ConsentState | undefined;
      }
    ) => {
      const { account, group } = variables;

      captureError(error);

      if (!context) {
        return;
      }

      setGroupConsentQueryData(account, group.topic, context.previousConsent);
      updateConversationInConversationListQuery({
        account,
        topic: group.topic,
        conversationUpdate: {
          state: context.previousConsent,
        },
      });
    },
  };
};

export const createAllowGroupMutationObserver = ({
  account,
  topic,
}: AllowGroupMutationProps) => {
  const allowGroupMutationObserver = new MutationObserver(
    queryClient,
    getAllowGroupMutationOptions(account, topic)
  );
  return allowGroupMutationObserver;
};

export const useAllowGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  return useMutation(getAllowGroupMutationOptions(account, topic));
};
