import { MutationObserver, QueryClient } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { consentToGroupsOnProtocol } from "@utils/xmtpRN/conversations";

import {
  cancelGroupConsentQuery,
  Consent,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export type GroupConsentAction = "allow" | "deny";

export type GroupConsentMutationProps = {
  account: string;
  topic: string;
  groupId: string;
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
      await consentToGroupsOnProtocol(account, [groupId], action);
      return consentStatus;
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
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
      await consentToGroupsOnProtocol(account, [groupId], action);
      return consentStatus;
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, consentStatus);
      return { previousConsent };
    },
    onError: (
      error: unknown,
      _variables: unknown,
      context: { previousConsent?: Consent }
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
