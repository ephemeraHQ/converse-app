import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { useAllowGroupMutation } from "@/features/consent/use-allow-group.mutation";
import { useDenyGroupMutation } from "@/features/consent/use-deny-group.mutation";
import { updateInboxIdsConsentForAccount } from "@/features/consent/update-inbox-ids-consent-for-account";
import { translate } from "@/i18n";
import { useGroupCreatorQuery } from "@/queries/useGroupCreatorQuery";
import { getGroupQueryOptions, useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useSafeCurrentSender } from "../authentication/account.store";

export type IGroupConsentOptions = {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
};

export const useGroupConsentForCurrentAccount = (topic: ConversationTopic) => {
  const currentSender = useSafeCurrentSender();
  const account = currentSender.ethereumAddress;

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

  const { mutateAsync: denyGroupMutation, isPending: isDenyingGroup } =
    useDenyGroupMutation(account, topic!);

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        throw new Error("Group is required");
      }

      await allowGroupMutation({
        account: currentSender.ethereumAddress,
        topic,
        includeAddedBy,
        includeCreator,
      });
    },
    [allowGroupMutation, group, currentSender, topic]
  );

  const denyGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        showSnackbar({
          type: "error",
          message: translate("group_not_found"),
        });
        return;
      }

      await denyGroupMutation();

      const inboxIdsToDeny: InboxId[] = [];

      if (includeAddedBy && group.addedByInboxId) {
        inboxIdsToDeny.push(group.addedByInboxId);
      }

      if (includeCreator && groupCreator) {
        inboxIdsToDeny.push(groupCreator);
      }

      if (inboxIdsToDeny.length > 0) {
        await updateInboxIdsConsentForAccount({
          account,
          inboxIds: inboxIdsToDeny,
          consent: "deny",
        });
      }
    },
    [denyGroupMutation, groupCreator, account, group]
  );

  const isLoading =
    isGroupLoading || isGroupCreatorLoading || isGroupConsentLoading;

  return {
    consent: groupConsent,
    isLoading,
    isError,
    allowGroup,
    denyGroup,
    isAllowingGroup,
    isDenyingGroup,
  };
};
