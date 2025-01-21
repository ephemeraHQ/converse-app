import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
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
  ConsentState,
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { MutationKeys } from "../../queries/MutationKeys";
import { updateConsentForGroupsForAccount } from "./update-consent-for-groups-for-account";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./use-group-consent.query";

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

      return "allowed";
    },
    onMutate: (args: AllowGroupMutationVariables) => {
      const { account, group } = args;
      const previousConsent = getGroupConsentQueryData(account, group.topic);
      setGroupConsentQueryData(account, group.topic, "allowed");
      updateConversationInConversationsQueryData({
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

      setGroupConsentQueryData(
        account,
        group.topic,
        context.previousConsent || "unknown"
      );
      updateConversationInConversationsQueryData({
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
