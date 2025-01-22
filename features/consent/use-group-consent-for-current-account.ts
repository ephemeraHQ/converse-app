import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { useAllowGroupMutation } from "@/features/consent/use-allow-group.mutation";
import { useDenyGroupMutation } from "@/features/consent/use-deny-group.mutation";
import { translate } from "@/i18n";
import { useGroupCreatorQuery } from "@/queries/useGroupCreatorQuery";
import { currentAccount } from "@data/store/accountsStore";
import { getGroupQueryOptions, useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";

export type IGroupConsentOptions = {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
};

export const useGroupConsentForCurrentAccount = (topic: ConversationTopic) => {
  const account = currentAccount();

  const { data: group, isLoading: isGroupLoading } = useGroupQuery({
    account,
    topic,
  });

  const { data: groupCreator, isLoading: isGroupCreatorLoading } =
    useGroupCreatorQuery(topic);

  const {
    data: groupConsent,
    isLoading: isGroupConsentLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({ account, topic }),
    select: (group) => group?.state,
  });

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } =
    useAllowGroupMutation(account, topic);

  const { mutateAsync: blockGroupMutation, isPending: isBlockingGroup } =
    useDenyGroupMutation(account, topic!);

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        throw new Error("Group is required");
      }

      await allowGroupMutation({
        account,
        topic,
        includeAddedBy,
        includeCreator,
      });
    },
    [allowGroupMutation, group, account, topic]
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
        updateInboxIdsConsentForAccount({
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
