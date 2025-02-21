import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export const streamConsent = async (account: string) => {
  try {
    logger.info(`[XMTPRN Contacts] Streaming consent for ${account}`);
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: account,
    });
    await client.preferences.streamConsent(async () => {
      logger.info(`[XMTPRN Contacts] Consent has been updated`);
      try {
        const conversations = getAllowedConsentConversationsQueryData({
          account,
        });
        // TODO: Consent Has Been Updated, resubscribe to notifications
        if (!conversations) {
          return;
        }
      } catch (e) {
        captureError(e);
      }
    });
  } catch (e) {
    captureError(e);
  }
};

export const stopStreamingConsent = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });
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
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: account,
    });
    await client.preferences.streamPreferenceUpdates(async (preference) => {
      logger.info(`[XMTPRN Contacts] Preference has been updated`);
    });
  } catch (e) {
    captureError(e);
  }
};

export const stopStreamingPreferences = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });
  return client.preferences.cancelStreamPreferenceUpdates();
};
