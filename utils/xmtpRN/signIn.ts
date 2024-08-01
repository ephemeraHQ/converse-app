import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
  moveTemporaryDatabasesToDatabaseDirecory,
} from "@utils/fileSystem";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import { sentryAddBreadcrumb } from "@utils/sentry";
import { Client } from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

import config from "../../config";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getInboxId = (address: string) =>
  Client.getOrCreateInboxId(address, { env });

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
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

  sentryAddBreadcrumb("Instantiating client from signer");

  const client = await Client.create(signer, {
    ...options,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
    preAuthenticateToInboxCallback,
  });

  if (client.inboxId !== inboxId) {
    throw new Error("Inbox ids don't match");
  }

  sentryAddBreadcrumb("Instantiated client from signer, exporting key bundle");
  const base64Key = await client.exportKeyBundle();
  // This Client is only be used to extract the key, we can disconnect
  // it to prevent locks happening during Onboarding
  await client.dropLocalDatabaseConnection();
  await moveTemporaryDatabasesToDatabaseDirecory(tempDirectory, client.inboxId);
  sentryAddBreadcrumb("Exported key bundle");
  return base64Key;
};
