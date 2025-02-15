import { XMTPError } from "@/utils/error";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export const syncConsent = async (account: string) => {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });
  try {
    await client.preferences.syncConsent();
  } catch (error) {
    throw new XMTPError("Failed to sync consent", error);
  }
};
