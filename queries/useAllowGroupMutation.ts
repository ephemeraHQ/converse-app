import { queryClient } from "@queries/queryClient";
import {
  useMutation,
  MutationObserver,
  MutationOptions,
} from "@tanstack/react-query";
import {
  consentToGroupsOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "@utils/xmtpRN/contacts";

import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import {
  ConsentState,
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client";
import {
  ConversationQueryData,
  getConversationQueryData,
  setConversationQueryData,
} from "./useConversationQuery";
import { captureError } from "@/utils/capture-error";
import { MutationKeys } from "./MutationKeys";

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
    previousConversation: ConversationQueryData | undefined;
  }
>;

const allowGroupMutationFn = async (args: AllowGroupMutationVariables) => {
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
};

const onMutateAllowGroupMutation = async (
  args: AllowGroupMutationVariables
): Promise<{
  previousConsent: ConsentState | undefined;
  previousConversation: ConversationQueryData | undefined;
}> => {
  const { account, group } = args;

  const topic = group.topic;

  await cancelGroupConsentQuery(account, topic);
  setGroupConsentQueryData(account, topic, "allowed");
  const previousConsent = getGroupConsentQueryData(account, topic);

  const previousConversation = getConversationQueryData(account, topic);

  if (previousConversation) {
    previousConversation.state = "allowed";
    setConversationQueryData(account, topic, previousConversation);
  }
  return { previousConsent, previousConversation };
};

const onErrorAllowGroupMutation = (
  error: unknown,
  variables: AllowGroupMutationVariables,
  context?: {
    previousConsent: ConsentState | undefined;
    previousConversation: ConversationQueryData | undefined;
  }
) => {
  const { account, group } = variables;

  const topic = group.topic;
  captureError(error);
  if (!context) {
    return;
  }

  if (context.previousConsent) {
    setGroupConsentQueryData(account, topic, context.previousConsent);
  }

  if (context.previousConversation) {
    setConversationQueryData(account, topic, context.previousConversation);
  }
};

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): IUseAllowGroupMutationOptions => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: allowGroupMutationFn,
    onMutate: onMutateAllowGroupMutation,
    onError: onErrorAllowGroupMutation,
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
