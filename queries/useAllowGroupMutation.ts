import { updateConversationInConversationListQuery } from "@/queries/useConversationListForCurrentUserQuery";
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
  consentToGroupsByGroupIds,
  consentToInboxIdsOnProtocolByInboxId,
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
  inboxId: string | undefined;
  topic: ConversationTopic;
  groupId: ConversationId;
};

export type AllowGroupMutationVariables = {
  includeAddedBy?: boolean;
  includeCreator?: boolean;
  group: GroupWithCodecsType;
  inboxId: string | undefined;
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
  inboxId: string | undefined,
  topic: ConversationTopic
): IUseAllowGroupMutationOptions => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, inboxId, topic],
    mutationFn: async (args: AllowGroupMutationVariables) => {
      const { includeAddedBy, includeCreator, group, inboxId } = args;

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
        consentToGroupsByGroupIds({
          inboxId,
          groupIds: [getV3IdFromTopic(groupTopic)],
          consent: "allow",
        }),
        ...(inboxIdsToAllow.length > 0
          ? [
              consentToInboxIdsOnProtocolByInboxId({
                inboxId,
                inboxIds: inboxIdsToAllow,
                consent: "allow",
              }),
            ]
          : []),
      ]);

      return "allowed";
    },
    onMutate: (args: AllowGroupMutationVariables) => {
      const { inboxId, group } = args;
      const previousConsent = getGroupConsentQueryData(inboxId, group.topic);
      setGroupConsentQueryData(inboxId, group.topic, "allowed");
      updateConversationInConversationListQuery({
        inboxId,
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
      const { inboxId, group } = variables;

      captureError(error);

      if (!context) {
        return;
      }

      setGroupConsentQueryData(inboxId, group.topic, context.previousConsent);
      updateConversationInConversationListQuery({
        inboxId,
        topic: group.topic,
        conversationUpdate: {
          state: context.previousConsent,
        },
      });
    },
  };
};

export const createAllowGroupMutationObserver = ({
  inboxId,
  topic,
}: AllowGroupMutationProps) => {
  const allowGroupMutationObserver = new MutationObserver(
    queryClient,
    getAllowGroupMutationOptions(inboxId, topic)
  );
  return allowGroupMutationObserver;
};

export const useAllowGroupMutation = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  return useMutation(getAllowGroupMutationOptions(inboxId, topic));
};
