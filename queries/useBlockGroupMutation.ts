import { useGroupId } from "@hooks/useGroupId";
import { useMutation } from "@tanstack/react-query";
import { consentToGroupsOnProtocol } from "@utils/xmtpRN/conversations";

import { blockGroupMutationKey } from "./MutationKeys";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export const useBlockGroupMutation = (account: string, topic: string) => {
  const { groupId } = useGroupId(topic);
  return useMutation({
    mutationKey: blockGroupMutationKey(account, topic),
    mutationFn: async () => {
      if (!groupId || !account) {
        return;
      }
      await consentToGroupsOnProtocol(account, [groupId], "deny");
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
    onSuccess: () => {
      console.log("onSuccess useDenyGroupMutation");
    },
  });
};
