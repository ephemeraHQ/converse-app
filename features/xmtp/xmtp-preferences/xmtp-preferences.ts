import { XMTPError } from "@/utils/error";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export const syncConsent = async (account: string) => {
  const client = await getXmtpClientByEthAddress({
    ethereumAddress: account,
  });
  try {
    await client.preferences.syncConsent();
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to sync consent",
    });
  }
};
