import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { translate } from "@/i18n";
import {
  getConversationQueryData,
  setConversationQueryData,
} from "@/queries/useConversationQuery";
import { captureError } from "@/utils/capture-error";
import { getV3IdFromTopic } from "@/utils/groupUtils/groupId";
import { currentAccount } from "@data/store/accountsStore";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
  useGroupConsentQuery,
} from "@queries/useGroupConsentQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import {
  consentToGroupsOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "@utils/xmtpRN/contacts";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useGroupCreator } from "./useGroupCreator";

export type IGroupConsentOptions = {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
};

export const useGroupConsent = (topic: ConversationTopic) => {
  const account = currentAccount();

  const { data: group, isLoading: isGroupLoading } = useGroupQuery(
    account,
    topic
  );

  const { data: groupCreator, isLoading: isGroupCreatorLoading } =
    useGroupCreator(topic);

  const {
    data: groupConsent,
    isLoading: isGroupConsentLoading,
    isError,
  } = useGroupConsentQuery(account, topic);

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } =
    useMutation({
      mutationFn: async (args: {
        includeAddedBy?: boolean;
        includeCreator?: boolean;
      }) => {
        const { includeAddedBy, includeCreator } = args;

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
            groupIds: [getV3IdFromTopic(topic)],
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
      onMutate: async () => {
        await cancelGroupConsentQuery(account, topic);
        setGroupConsentQueryData(account, topic, "allowed");
        const previousConsent = getGroupConsentQueryData(account, topic);

        const previousConversation = getConversationQueryData(account, topic);

        if (previousConversation) {
          previousConversation.state = "allowed";
          setConversationQueryData(account, topic, previousConversation);
        }

        return { previousConsent, previousConversation };
      },
      onError: (error, _variables, context) => {
        captureError(error);
        if (!context) {
          return;
        }

        if (context.previousConsent) {
          setGroupConsentQueryData(account, topic, context.previousConsent);
        }

        if (context.previousConversation) {
          setConversationQueryData(
            account,
            topic,
            context.previousConversation
          );
        }
      },
    });

  const { mutateAsync: blockGroupMutation, isPending: isBlockingGroup } =
    useBlockGroupMutation(account, topic!);

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      await allowGroupMutation({ includeAddedBy, includeCreator });
    },
    [allowGroupMutation]
  );

  const blockGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        showSnackbar({
          type: "error",
          message: translate("group_not_found"),
        });
        return;
      }

      await blockGroupMutation();

      const inboxIdsToDeny: InboxId[] = [];

      if (includeAddedBy && group.addedByInboxId) {
        inboxIdsToDeny.push(group.addedByInboxId);
      }

      if (includeCreator && groupCreator) {
        inboxIdsToDeny.push(groupCreator);
      }

      if (inboxIdsToDeny.length > 0) {
        consentToInboxIdsOnProtocolByAccount({
          account,
          inboxIds: inboxIdsToDeny,
          consent: "deny",
        });
      }
    },
    [blockGroupMutation, groupCreator, account, group]
  );

  const isLoading =
    isGroupLoading || isGroupCreatorLoading || isGroupConsentLoading;

  return {
    consent: groupConsent,
    isLoading,
    isError,
    allowGroup,
    blockGroup,
    isAllowingGroup,
    isBlockingGroup,
  };
};
