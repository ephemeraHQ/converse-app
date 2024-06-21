import { useMutation } from "@tanstack/react-query";

import { refreshGroup } from "../utils/xmtpRN/conversations";
import { allowGroupMutationKey } from "./MutationKeys";
import { useClient } from "./useClient";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";
import { useGroupQuery } from "./useGroupQuery";

export const useAllowGroupMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  const client = useClient(account);
  return useMutation({
    mutationKey: allowGroupMutationKey(account, topic),
    mutationFn: async () => {
      if (!group || !account || !topic || !client) {
        return;
      }
      await client.contacts.allowGroups([group.id]);
      return "allowed";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, "allowed");
      return { previousConsent };
    },
    // eslint-disable-next-line node/handle-callback-err
    onError: (_error, _variables, context) => {
      console.log("onError useAllowGroupMutation");
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useAllowGroupMutation");
      refreshGroup(account, topic);
    },
  });
};
