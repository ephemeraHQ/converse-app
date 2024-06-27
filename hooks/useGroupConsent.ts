import { currentAccount, useSettingsStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useAddedByQuery } from "@queries/useAddedByQuery";
import { useAllowGroupMutation } from "@queries/useAllowGroupMutation";
import { useBlockGroupMutation } from "@queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { consentToInboxIdsOnProtocol } from "@utils/xmtpRN/conversations";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

import { useGroupCreator } from "./useGroupCreator";

interface OnConsentOptions {
  includeCreator?: boolean;
  includeAddedBy?: boolean;
}

export const useGroupConsent = (topic: string) => {
  const account = currentAccount();
  const { groupCreator } = useGroupCreator(topic);
  const { data: addedBy } = useAddedByQuery(account, topic);
  const { data, isLoading, isError } = useGroupConsentQuery(account, topic);
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
      await allowGroupMutation();
      setGroupStatus({ [topic]: "allowed" });
      const inboxIdsToAllow: InboxId[] = [];
      const inboxIds: { [inboxId: string]: "allowed" } = {};
      if (options.includeAddedBy && addedBy) {
        inboxIds[addedBy] = "allowed";
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
      addedBy,
      groupCreator,
      setInboxIdPeerStatus,
    ]
  );

  const blockGroup = useCallback(
    async (options: OnConsentOptions) => {
      await blockGroupMutation();
      setGroupStatus({ [topic]: "denied" });
      const inboxIdsToDeny: InboxId[] = [];
      const inboxIds: { [inboxId: string]: "denied" } = {};
      if (options.includeAddedBy && addedBy) {
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
      addedBy,
      groupCreator,
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
