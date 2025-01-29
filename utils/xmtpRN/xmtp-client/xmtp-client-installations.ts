import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { Client } from "@xmtp/react-native-sdk";
import { useEffect, useRef } from "react";
import { getXmtpClient } from "./xmtp-client";

import { logoutAccount } from "@/utils/logout";

export const isClientInstallationValid = async (client: Client) => {
  const inboxState = await client.inboxState(true);
  const installationsIds = inboxState.installations.map((i) => i.id);
  logger.debug(
    `Current installation id : ${client.installationId} - All installation ids : ${installationsIds}`
  );
  if (!installationsIds.includes(client.installationId)) {
    logger.warn(`Installation ${client.installationId} has been revoked`);
    return false;
  } else {
    logger.debug(`Installation ${client.installationId} is not revoked`);
    return true;
  }
};

export const useCheckCurrentInstallation = () => {
  const account = useCurrentAccount() as string;

  // To make sure we're checking only once
  const accountCheck = useRef<string | undefined>(undefined);
  useEffect(() => {
    const check = async () => {
      if (!account) return;
      if (accountCheck.current === account) return;
      accountCheck.current = account;
      const client = (await getXmtpClient({
        address: account,
      })) as Client;
      console.log("client:", client);
      const installationValid = await isClientInstallationValid(client);
      console.log("installationValid:", installationValid);

      if (!installationValid) {
        await awaitableAlert(
          translate("current_installation_revoked"),
          translate("current_installation_revoked_description")
        );
        logoutAccount({ account });
        accountCheck.current = undefined;
      }
    };
    check().catch(async (e) => {
      if (
        `${e}`.includes(
          "No v3 keys found, you must pass a SigningKey in order to enable alpha MLS features"
        )
      ) {
        logoutAccount({ account });
        accountCheck.current = undefined;
      }
      accountCheck.current = undefined;
      logger.warn(e, {
        error: `Could not check inbox state for ${account}`,
      });
    });
  }, [account]);
};
export type InstallationSignature = {
  installationPublicKey: string;
  installationKeySignature: string;
};

export async function getInstallationKeySignature(
  account: string,
  message: string
): Promise<InstallationSignature> {
  const client = await getXmtpClient({
    address: account,
  });

  if (!client) throw new Error("Client not found");

  const raw = await client.signWithInstallationKey(message);

  return {
    installationPublicKey: client.installationId,
    installationKeySignature: Buffer.from(raw).toString("hex"),
  };
}
