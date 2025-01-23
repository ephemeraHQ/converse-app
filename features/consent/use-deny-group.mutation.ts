import { updateConsentForGroupsForAccount } from "@/features/consent/update-consent-for-groups-for-account";
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/queries/unknown-consent-conversations-query";
import {
  addConversationToConversationsQuery,
  removeConversationFromConversationsQuery,
} from "@/queries/use-conversations-query";
import { getGroupQueryData, setGroupQueryData } from "@/queries/useGroupQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { useMutation } from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { blockGroupMutationKey } from "../../queries/MutationKeys";

export const useDenyGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  return useMutation({
    mutationKey: blockGroupMutationKey(account, topic!),
    mutationFn: async () => {
      if (!topic || !account) {
        return;
      }
      await updateConsentForGroupsForAccount({
        account,
        groupIds: [getV3IdFromTopic(topic)],
        consent: "deny",
      });
      return "denied";
    },
    onMutate: async () => {
      const previousGroup = getGroupQueryData({ account, topic });

      if (!previousGroup) {
        throw new Error("Previous group not found");
      }

      const updatedGroup = updateObjectAndMethods(previousGroup!, {
        state: "denied",
      });

      setGroupQueryData({ account, topic, group: updatedGroup });

      // Remove from main conversations list
      removeConversationFromConversationsQuery({
        account,
        topic: topic!,
      });

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        account,
        topic,
      });

      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return;
      }

      setGroupQueryData({ account, topic, group: context.previousGroup });

      // Add back to main conversations list
      addConversationToConversationsQuery({
        account,
        conversation: context.previousGroup,
      });

      // Add back to requests
      addConversationToUnknownConsentConversationsQuery({
        account,
        conversation: context.previousGroup,
      });
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation");
    },
  });
};
