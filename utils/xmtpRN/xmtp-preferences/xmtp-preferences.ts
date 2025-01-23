import { getXmtpClient } from "../sync";

export const syncConsent = async (account: string) => {
  const client = await getXmtpClient(account);
  await client.preferences.syncConsent();
};
