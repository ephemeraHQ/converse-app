import { MutationObserver, QueryClient } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { consentToGroupsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import {
  ConsentState,
  ConversationId,
  ConversationTopic,
} from "@xmtp/react-native-sdk";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export type GroupConsentAction = "allow" | "deny";

export type GroupConsentMutationProps = {
  account: string;
  topic: ConversationTopic;
  groupId: ConversationId;
  action: GroupConsentAction;
};

export const createGroupConsentMutationObserver = (
  queryClient: QueryClient,
  mutationKey: unknown[],
  { account, topic, groupId, action }: GroupConsentMutationProps
) => {
  const consentStatus = action === "allow" ? "allowed" : "denied";

  return new MutationObserver(queryClient, {
    mutationKey,
    mutationFn: async () => {
      await consentToGroupsOnProtocolByAccount({
        account,
        groupIds: [groupId],
        consent: action,
      });
      return consentStatus;
    },
    onMutate: async () => {
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, consentStatus);
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      logger.warn(
        `onError use${
          action.charAt(0).toUpperCase() + action.slice(1)
        }GroupMutation`
      );
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug(
        `onSuccess use${
          action.charAt(0).toUpperCase() + action.slice(1)
        }GroupMutation`
      );
    },
  });
};

export const getGroupConsentMutationOptions = ({
  account,
  topic,
  groupId,
  action,
}: GroupConsentMutationProps) => {
  const consentStatus = action === "allow" ? "allowed" : "denied";

  return {
    mutationFn: async () => {
      if (!groupId || !account) {
        return;
      }
      await consentToGroupsOnProtocolByAccount({
        account,
        groupIds: [groupId],
        consent: action,
      });
      return consentStatus;
    },
    onMutate: async () => {
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, consentStatus);
      return { previousConsent };
    },
    onError: (
      error: unknown,
      _variables: unknown,
      context: { previousConsent?: ConsentState }
    ) => {
      logger.warn(
        `onError use${
          action.charAt(0).toUpperCase() + action.slice(1)
        }GroupMutation`
      );
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug(
        `onSuccess use${
          action.charAt(0).toUpperCase() + action.slice(1)
        }GroupMutation`
      );
    },
  };
};
