import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { translate } from "@/i18n";
import { useAllowGroupMutation } from "@/queries/useAllowGroupMutation";
import { getCurrentInboxId } from "@data/store/accountsStore";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import { consentToInboxIdsOnProtocolByInboxId } from "@utils/xmtpRN/contacts";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useGroupCreatorQuery } from "../queries/useGroupCreatorQuery";

export type IGroupConsentOptions = {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
};

export const useGroupConsent = (topic: ConversationTopic) => {
  const inboxId = getCurrentInboxId();

  const { data: group, isLoading: isGroupLoading } = useGroupQuery({
    inboxId,
    topic,
  });

  const { data: groupCreator, isLoading: isGroupCreatorLoading } =
    useGroupCreatorQuery(topic);

  const {
    data: groupConsent,
    isLoading: isGroupConsentLoading,
    isError,
  } = useGroupConsentQuery({ inboxId, topic });

  const { mutateAsync: allowGroupMutation, isPending: isAllowingGroup } =
    useAllowGroupMutation({ inboxId, topic });

  const { mutateAsync: blockGroupMutation, isPending: isBlockingGroup } =
    useBlockGroupMutation({ inboxId, topic });

  const allowGroup = useCallback(
    async (args: IGroupConsentOptions) => {
      const { includeAddedBy, includeCreator } = args;

      if (!group) {
        throw new Error("Group is required");
      }

      await allowGroupMutation({
        group,
        inboxId,
        includeAddedBy,
        includeCreator,
      });
    },
    [allowGroupMutation, group, inboxId]
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
        consentToInboxIdsOnProtocolByInboxId({
          inboxId,
          inboxIds: inboxIdsToDeny,
          consent: "deny",
        });
      }
    },
    [blockGroupMutation, groupCreator, inboxId, group]
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
