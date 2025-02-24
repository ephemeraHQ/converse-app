import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { captureError } from "@/utils/capture-error";
import { xmtpLogger } from "@/utils/logger";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export const streamConsent = async (account: string) => {
  try {
    xmtpLogger.info(`Streaming consent for ${account}`);
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: account,
    });
    await client.preferences.streamConsent(async () => {
      xmtpLogger.info(`Consent has been updated`);
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
  xmtpLogger.info(`Stopping consent stream for ${account}`);
  return client.preferences.cancelStreamConsent();
};

/**
 * Not implemented yet
 * @param account
 */
export const streamPreferences = async (account: string) => {
  try {
    xmtpLogger.info(`Streaming preferences for ${account}`);
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: account,
    });
    await client.preferences.streamPreferenceUpdates(async (preference) => {
      xmtpLogger.info(`Preference has been updated`);
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
