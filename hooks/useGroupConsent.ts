import { currentAccount, useSettingsStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useAllowGroupMutation } from "@queries/useAllowGroupMutation";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import { QueryObserverOptions } from "@tanstack/react-query";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { consentToInboxIdsOnProtocol } from "@utils/xmtpRN/conversations";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

import { useGroupCreator } from "./useGroupCreator";

export interface OnConsentOptions {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
}

export const useGroupConsent = (
  topic: string,
  queryOptions?: Partial<QueryObserverOptions<"allowed" | "denied" | "unknown">>
) => {
  const account = currentAccount();
  const { data: group } = useGroupQuery(account, topic);
  const { groupCreator } = useGroupCreator(topic);
  const { data, isLoading, isError } = useGroupConsentQuery(
    account,
    topic,
    queryOptions
  );
  const { mutateAsync: allowGroupMutation } = useAllowGroupMutation(
    account,
    topic
  );
  const { mutateAsync: blockGroupMutation } = useBlockGroupMutation(
    account,
    topic
  );
  const { setGroupStatus, setInboxIdPeerStatus } = useSettingsStore(
    useSelect(["setGroupStatus", "setInboxIdPeerStatus"])
  );

  const allowGroup = useCallback(
    async (options: OnConsentOptions) => {
      logger.debug(`[useGroupConsent] Allowing group ${topic}`);
      await allowGroupMutation();
      setGroupStatus({ [getGroupIdFromTopic(topic).toLowerCase()]: "allowed" });
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
        consentToInboxIdsOnProtocol(currentAccount(), inboxIdsToAllow, "allow");
        setInboxIdPeerStatus(inboxIds);
      }
    },
    [
      allowGroupMutation,
      setGroupStatus,
      topic,
      groupCreator,
      group,
      setInboxIdPeerStatus,
    ]
  );

  const blockGroup = useCallback(
    async (options: OnConsentOptions) => {
      await blockGroupMutation();
      setGroupStatus({ [getGroupIdFromTopic(topic).toLowerCase()]: "denied" });
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
        consentToInboxIdsOnProtocol(currentAccount(), inboxIdsToDeny, "deny");
        setInboxIdPeerStatus(inboxIds);
      }
    },
    [
      blockGroupMutation,
      setGroupStatus,
      topic,
      groupCreator,
      group,
      setInboxIdPeerStatus,
    ]
  );

  return {
    consent: data,
    isLoading,
    isError,
    allowGroup,
    blockGroup,
  };
};
