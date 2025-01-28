import { subscribeToNotifications } from "@/features/notifications/utils/subscribeToNotifications";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { getXmtpClient } from "../xmtp-client/xmtp-client";
import { ConverseXmtpClientType } from "../client.types";
import { getConversationsQueryData } from "@/queries/use-conversations-query";

export const streamConsent = async (account: string) => {
  try {
    logger.info(`[XMTPRN Contacts] Streaming consent for ${account}`);
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    await client.preferences.streamConsent(async () => {
      logger.info(`[XMTPRN Contacts] Consent has been updated`);
      try {
        // Consent Has Been Updated, resubscribe to notifications
        const conversations = getConversationsQueryData({ account });
        if (!conversations) {
          return;
        }
        subscribeToNotifications({
          conversations: conversations,
          account,
        });
      } catch (e) {
        captureError(e);
      }
    });
  } catch (e) {
    captureError(e);
  }
};

export const stopStreamingConsent = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.info(`[XMTPRN Contacts] Stopping streaming consent for ${account}`);
  return client.preferences.cancelStreamConsent();
};

/**
 * Not implemented yet
 * @param account
 */
export const streamPreferences = async (account: string) => {
  try {
    logger.info(`[XMTPRN Contacts] Streaming preferences for ${account}`);
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    await client.preferences.streamPreferenceUpdates(async (preference) => {
      logger.info(`[XMTPRN Contacts] Preference has been updated`);
    });
  } catch (e) {
    captureError(e);
  }
};

export const stopStreamingPreferences = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.preferences.cancelStreamPreferenceUpdates();
};
