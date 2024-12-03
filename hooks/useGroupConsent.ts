import { currentAccount } from "@data/store/accountsStore";
import { useAllowGroupMutation } from "@queries/useAllowGroupMutation";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import { QueryObserverOptions } from "@tanstack/react-query";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

import { useGroupCreator } from "./useGroupCreator";
import logger from "@/utils/logger";

type OnConsentOptions = {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
};

export const useGroupConsent = (
  topic: ConversationTopic | undefined,
  queryOptions?: Partial<QueryObserverOptions<"allowed" | "denied" | "unknown">>
) => {
  const account = currentAccount();
  const { data: group } = useGroupQuery(account, topic);
  const { data: groupCreator } = useGroupCreator(topic);
  const { data, isLoading, isError } = useGroupConsentQuery(
    account,
    topic,
    queryOptions
  );
  const { mutateAsync: allowGroupMutation } = useAllowGroupMutation(
    account,
    topic!
  );
  const { mutateAsync: blockGroupMutation } = useBlockGroupMutation(
    account,
    topic!
  );

  const allowGroup = useCallback(
    async (options: OnConsentOptions) => {
      await allowGroupMutation();
      const inboxIdsToAllow: InboxId[] = [];
      const inboxIds: { [inboxId: string]: "allowed" } = {};
      if (options.includeAddedBy && group?.addedByInboxId) {
        const addedBy = group.addedByInboxId;
        inboxIds[addedBy as string] = "allowed";
        inboxIdsToAllow.push(addedBy);
      }
      if (options.includeCreator && groupCreator) {
        inboxIds[groupCreator] = "allowed";
        inboxIdsToAllow.push(groupCreator);
      }
      if (inboxIdsToAllow.length > 0) {
        consentToInboxIdsOnProtocolByAccount({
          account,
          inboxIds: inboxIdsToAllow,
          consent: "allow",
        });
      }
    },
    [allowGroupMutation, group?.addedByInboxId, groupCreator, account]
  );

  const blockGroup = useCallback(
    async (options: OnConsentOptions) => {
      await blockGroupMutation();
      const inboxIdsToDeny: InboxId[] = [];
      const inboxIds: { [inboxId: string]: "denied" } = {};
      if (options.includeAddedBy && group?.addedByInboxId) {
        const addedBy = group.addedByInboxId;
        inboxIds[addedBy] = "denied";
        inboxIdsToDeny.push(addedBy);
      }
      if (options.includeCreator && groupCreator) {
        inboxIds[groupCreator] = "denied";
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
    [blockGroupMutation, group?.addedByInboxId, groupCreator, account]
  );

  return {
    consent: data,
    isLoading,
    isError,
    allowGroup,
    blockGroup,
  };
};
