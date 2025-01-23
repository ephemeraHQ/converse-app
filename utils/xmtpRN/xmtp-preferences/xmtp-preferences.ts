import logger from "@/utils/logger";
import { getXmtpClient } from "../sync";
import { captureError } from "@/utils/capture-error";

export const syncConsent = async (account: string) => {
  const client = await getXmtpClient(account);
  try {
    await client.preferences.syncConsent();
  } catch (error) {
    captureError(error, {
      caller: "syncConsent",
    });
  }
};
