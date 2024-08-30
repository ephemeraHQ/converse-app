import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
  deleteLibXmtpDatabaseForInboxId,
  moveTemporaryDatabasesToDatabaseDirecory as moveTemporaryDatabasesToDatabaseDirectory,
} from "@utils/fileSystem";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { Client } from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

import { isClientInstallationValid } from "./client";
import config from "../../config";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getInboxId = (address: string) =>
  Client.getOrCreateInboxId(address, { env });

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  onInstallationRevoked: () => Promise<void>,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>,
  preAuthenticateToInboxCallback?: () => Promise<void>
) => {
  const tempDirectory = await createTemporaryDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  const options = {
    env,
    enableV3: true,
    dbDirectory: tempDirectory,
    dbEncryptionKey,
  };
  const inboxId = await Client.getOrCreateInboxId(
    await signer.getAddress(),
    options
  );

  await copyDatabasesToTemporaryDirectory(tempDirectory, inboxId);

  logger.debug("Instantiating client from signer");

  const client = await Client.create(signer, {
    ...options,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
    preAuthenticateToInboxCallback,
  });

  if (client.inboxId !== inboxId) {
    throw new Error("Inbox ids don't match");
  }

  // In case we're logging with an existing libxmtp database, make sure
  // the installation has not already been revoked
  const installationValid = await isClientInstallationValid(client);
  if (!installationValid) {
    await client.dropLocalDatabaseConnection();
    await deleteLibXmtpDatabaseForInboxId(inboxId);
    onInstallationRevoked();
    return;
  }

  logger.debug("Instantiated client from signer, exporting key bundle");
  const base64Key = await client.exportKeyBundle();

  await revokeOtherInstallations(signer, client);

  // This Client is only be used to extract the key, we can disconnect
  // it to prevent locks happening during Onboarding
  await client.dropLocalDatabaseConnection();
  await moveTemporaryDatabasesToDatabaseDirectory(
    tempDirectory,
    client.inboxId
  );
  logger.debug("Exported key bundle");
  return base64Key;
};

/*
Temporary method for XMTP team to revoke other installations
when logging in to remove weird, broken installation
*/
const revokeOtherInstallations = async (signer: Signer, client: Client) => {
  const state = await client.inboxState(true);
  logger.debug(
    `Current installation id : ${client.installationId} - All installation ids : ${state.installationIds}`
  );
  const otherInstallations = state.installationIds.filter(
    (installationId) => installationId !== client.installationId
  );
  if (otherInstallations.length > 0) {
    logger.warn(
      `Inbox ${client.inboxId} has ${otherInstallations.length} installations to revoke`
    );
    // We're on a mobile wallet so we need to ask the user first
    const doRevoke = await awaitableAlert(
      translate("other_installations_count", {
        count: otherInstallations.length,
      }),
      translate("temporary_revoke_description"),
      "Yes",
      "No"
    );
    if (!doRevoke) {
      logger.debug(`[Onboarding] User decided not to revoke`);
      return;
    }
    logger.debug(
      `[Onboarding] User decided to revoke ${otherInstallations.length} installation`
    );
    await client.revokeAllOtherInstallations(signer);
    logger.debug(`[Onboarding] Installations revoked.`);
  }
};
