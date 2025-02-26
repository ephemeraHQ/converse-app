import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { XMTPError } from "@/utils/error";
import { xmtpLogger } from "@/utils/logger";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export const streamConsent = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });

  xmtpLogger.debug(`Streaming consent for ${client.address}`);

  try {
    await client.preferences.streamConsent(async () => {
      xmtpLogger.debug(`Consent has been updated for ${client.address}`);

      const conversations = getAllowedConsentConversationsQueryData({
        account,
      });

      // TODO: Consent Has Been Updated, resubscribe to notifications
      if (!conversations) {
        return;
      }
    });
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stream consent",
    });
  }
};

export const stopStreamingConsent = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });

  xmtpLogger.debug(`Stopping consent stream for ${client.address}`);

  try {
    const startTime = Date.now();
    await client.preferences.cancelStreamConsent();
    const duration = Date.now() - startTime;

    if (duration > 3000) {
      xmtpLogger.warn(`Canceling consent stream took longer than expected`, {
        duration,
        address: client.address,
      });
    }

    xmtpLogger.debug(`Stopped consent stream for ${client.address}`);
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stop consent stream",
    });
  }
};

export const streamPreferences = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });

  xmtpLogger.debug(`Streaming preferences for ${client.address}`);

  try {
    await client.preferences.streamPreferenceUpdates(async (preference) => {
      xmtpLogger.debug(`Preference updated for ${client.address}`, {
        preference,
      });
    });
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stream preferences",
    });
  }
};

export const stopStreamingPreferences = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });

  xmtpLogger.debug(`Stopping preferences stream for ${client.address}`);

  try {
    const startTime = Date.now();
    await client.preferences.cancelStreamPreferenceUpdates();
    const duration = Date.now() - startTime;

    if (duration > 3000) {
      xmtpLogger.warn(
        `Canceling preferences stream took longer than expected`,
        {
          duration,
          address: client.address,
        },
      );
    }

    xmtpLogger.debug(`Stopped preferences stream for ${client.address}`);
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to stop preferences stream",
    });
  }
};
