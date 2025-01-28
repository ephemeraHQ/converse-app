import { XMTPError } from "@/utils/error";
import { getXmtpClient } from "../xmtp-client/xmtp-client";

export const syncConsent = async (account: string) => {
  const client = await getXmtpClient({ address: account });
  try {
    await client.preferences.syncConsent();
  } catch (error) {
    throw new XMTPError("Failed to sync consent", error);
  }
};
