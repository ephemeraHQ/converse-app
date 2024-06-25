import { useMutation } from "@tanstack/react-query";

import { refreshGroup } from "../utils/xmtpRN/conversations";
import { blockGroupMutationKey } from "./MutationKeys";
import { useClient } from "./useClient";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";
import { useGroupQuery } from "./useGroupQuery";

export const useBlockGroupMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  const client = useClient(account);
  return useMutation({
    mutationKey: blockGroupMutationKey(account, topic),
    mutationFn: async () => {
      if (!group || !account || !topic || !client) {
        return;
      }
      await client.contacts.denyGroups([topic]);
      return "denied";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, "denied");
      return { previousConsent };
    },
    // eslint-disable-next-line node/handle-callback-err
    onError: (_error, _variables, context) => {
      console.log("onError useDenyGroupMutation");
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useDenyGroupMutation");
      refreshGroup(account, topic);
    },
  });
};
