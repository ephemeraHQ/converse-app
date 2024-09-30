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
