import { captureError } from "@/utils/capture-error";
import { getXmtpClient } from "../xmtp-client/xmtp-client";

export const syncConsent = async (account: string) => {
  const client = await getXmtpClient({ address: account });
  try {
    await client.preferences.syncConsent();
  } catch (error) {
    captureError(error, {
      caller: "syncConsent",
    });
  }
};
