import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { Client } from "@xmtp/react-native-sdk";
import { useEffect, useRef } from "react";
import { getXmtpClient } from "./xmtp-client";

import { logoutAccount } from "@/utils/logout";

export const isClientInstallationValid = async (client: Client) => {
  logger.debug(`[isClientInstallationValid] Starting validation for client`);
  const inboxState = await client.inboxState(true);
  const installationsIds = inboxState.installations.map((i) => i.id);

  logger.debug(
    `[isClientInstallationValid] Current installation details:
    - Installation ID: ${client.installationId}
    - All Installation IDs: ${JSON.stringify(installationsIds, null, 2)}`
  );

  if (!installationsIds.includes(client.installationId)) {
    logger.warn(
      `[isClientInstallationValid] Installation ${client.installationId} has been revoked`
    );
    return false;
  }

  logger.debug(
    `[isClientInstallationValid] Installation ${client.installationId} is valid and active`
  );
  return true;
};

export const useCheckCurrentInstallation = () => {
  const account = useCurrentAccount() as string;

  // To make sure we're checking only once
  const accountCheck = useRef<string | undefined>(undefined);
  useEffect(() => {
    const check = async () => {
      logger.debug(`[useCheckCurrentInstallation] Starting installation check`);

      if (!account) {
        logger.debug(
          `[useCheckCurrentInstallation] No account found, skipping check`
        );
        return;
      }

      if (accountCheck.current === account) {
        logger.debug(
          `[useCheckCurrentInstallation] Check already performed for account ${account}`
        );
        return;
      }

      logger.debug(
        `[useCheckCurrentInstallation] Checking installation for account: ${account}`
      );
      accountCheck.current = account;

      const client = (await getXmtpClient({
        address: account,
      })) as Client;

      logger.debug(
        `[useCheckCurrentInstallation] Retrieved XMTP client for account: ${account}`
      );
      const installationValid = await isClientInstallationValid(client);

      if (!installationValid) {
        logger.warn(
          `[useCheckCurrentInstallation] Invalid installation detected for account: ${account}`
        );
        await awaitableAlert(
          translate("current_installation_revoked"),
          translate("current_installation_revoked_description")
        );
        logoutAccount({ account });
        accountCheck.current = undefined;
      }
    };
    check().catch(async (e) => {
      logger.error(`[useCheckCurrentInstallation] Error during installation check:
      - Account: ${account}
      - Error: ${e}
      - Stack: ${e.stack}`);

      if (
        `${e}`.includes(
          "No v3 keys found, you must pass a SigningKey in order to enable alpha MLS features"
        )
      ) {
        logger.warn(
          `[useCheckCurrentInstallation] No v3 keys found for account: ${account}, logging out`
        );
        logoutAccount({ account });
        accountCheck.current = undefined;
      }
      accountCheck.current = undefined;
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
  logger.debug(`[getInstallationKeySignature] Starting signature process:
  - Account: ${account}
  - Message: ${message}`);

  const client = await getXmtpClient({
    address: account,
  });

  if (!client) {
    logger.error(
      `[getInstallationKeySignature] Client not found for account: ${account}`
    );
    throw new Error("Client not found");
  }

  logger.debug(
    `[getInstallationKeySignature] Retrieved client for account: ${account}`
  );
  const raw = await client.signWithInstallationKey(message);

  const signature = {
    installationPublicKey: client.installationId,
    installationKeySignature: Buffer.from(raw).toString("hex"),
  };

  logger.debug(`[getInstallationKeySignature] Generated signature:
  ${JSON.stringify(signature, null, 2)}`);

  return signature;
}
