import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/sync";
import logger from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";

type UpdateInboxIdsConsentForAccountParams = {
  account: string;
  inboxIds: InboxId[];
  consent: "allow" | "deny";
};

export const updateInboxIdsConsentForAccount = async ({
  account,
  inboxIds,
  consent,
}: UpdateInboxIdsConsentForAccountParams): Promise<void> => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  if (!client) {
    throw new Error("Client not found");
  }

  logger.debug(
    `[XMTPRN Contacts] Consenting to inboxIds on protocol: ${inboxIds.join(
      ", "
    )}`
  );
  const start = new Date().getTime();

  const state = consent === "allow" ? "allowed" : "denied";

  for (const inboxId of inboxIds) {
    await client.preferences.setConsentState({
      value: inboxId,
      entryType: "inbox_id",
      state,
    });
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Consented to inboxIds on protocol in ${
      (end - start) / 1000
    } sec`
  );
};
