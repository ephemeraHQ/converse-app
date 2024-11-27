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
import { useGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useGroupCreator } from "./useGroupCreator";
import { useAllowGroupMutation } from "@/queries/useAllowGroupMutation";

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
