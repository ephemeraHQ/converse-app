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
import { ethersSignerToXmtpSigner } from "./signer";
import config from "../../config";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getInboxId = (address: string) =>
  Client.getOrCreateInboxId(address, { env });

type SignInUsingSignerParams = {
  signer: Signer;
  isSCW: boolean;
  onInstallationRevoked: () => Promise<void>;
  preCreateIdentityCallback?: () => Promise<void>;
  preEnableIdentityCallback?: () => Promise<void>;
  preAuthenticateToInboxCallback?: () => Promise<void>;
};

export const signInUsingSigner = async ({
  signer,
  isSCW,
  onInstallationRevoked,
  preCreateIdentityCallback,
  preEnableIdentityCallback,
  preAuthenticateToInboxCallback,
}: SignInUsingSignerParams) => {
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
  const createParams = {
    ...options,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
    preAuthenticateToInboxCallback,
  };

  const client = isSCW
    ? await Client.createV3(
        ethersSignerToXmtpSigner(signer, true),
        createParams
      )
    : await Client.create(ethersSignerToXmtpSigner(signer), createParams);

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
  let v2Base64Key: string | undefined;
  if (!isSCW) {
    logger.debug("Instantiated client from signer, exporting key bundle");
    v2Base64Key = await client.exportKeyBundle();
    logger.debug("Exported key bundle");
  }

  // This Client is only be used to extract the key, we can disconnect
  // it to prevent locks happening during Onboarding
  await client.dropLocalDatabaseConnection();
  await moveTemporaryDatabasesToDatabaseDirectory(
    tempDirectory,
    client.inboxId
  );
  return v2Base64Key;
};
