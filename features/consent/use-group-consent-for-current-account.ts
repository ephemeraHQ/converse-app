import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { translate } from "@/i18n";
import { useAllowGroupMutation } from "@/features/consent/use-allow-group.mutation";
import { currentAccount } from "@data/store/accountsStore";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "@/features/consent/use-group-consent.query";
import { useGroupQuery } from "@queries/useGroupQuery";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useGroupCreatorQuery } from "@/queries/useGroupCreatorQuery";

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
  } = useGroupConsentQuery({ account, topic });

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } =
    useAllowGroupMutation(account, topic);

  const { mutateAsync: blockGroupMutation, isPending: isBlockingGroup } =
    useBlockGroupMutation(account, topic!);

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        throw new Error("Group is required");
      }

      await allowGroupMutation({
        group,
        account,
        includeAddedBy,
        includeCreator,
      });
    },
    [allowGroupMutation, group, account]
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
