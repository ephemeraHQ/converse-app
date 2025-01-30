import { config } from "@/config";
import { deleteLibXmtpDatabaseForInboxId } from "@utils/fileSystem";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { Client, Signer as XmtpSigner } from "@xmtp/react-native-sdk";
import { Signer } from "ethers";
import { isClientInstallationValid } from "./xmtp-client/xmtp-client-installations";
import {
  ViemAccount,
  ethersSignerToXmtpSigner,
  viemAccountToXmtpSigner,
} from "./signer";
import { getDbDirectory } from "@/data/db";

export const getInboxId = (address: string) =>
  Client.getOrCreateInboxId(address, config.xmtpEnv);

const createXmtpClientFromXmtpSigner = async (
  signer: XmtpSigner,
  onInstallationRevoked: () => Promise<void>,
  preAuthenticateToInboxCallback?: () => Promise<void>
) => {
  const [dbDirectory, dbEncryptionKey] = await Promise.all([
    getDbDirectory(),
    getDbEncryptionKey(),
  ]);
  logger.debug(
    "[createXmtpClientFromXmtpSigner] Getting database encryption key"
  );

  const options = {
    env: config.xmtpEnv,
    enableV3: true,
    dbDirectory: dbDirectory,
    dbEncryptionKey,
  };
  logger.debug(
    `[createXmtpClientFromXmtpSigner] Client options configured: ${JSON.stringify(
      options
    )}`
  );

  logger.debug("[createXmtpClientFromXmtpSigner] Getting signer address");
  const signerAddress = await signer.getAddress();
  logger.debug(
    `[createXmtpClientFromXmtpSigner] Signer address: ${signerAddress}`
  );

  logger.debug("[createXmtpClientFromXmtpSigner] Getting inbox ID");
  const inboxId = await getInboxId(signerAddress);
  logger.debug(`[createXmtpClientFromXmtpSigner] Inbox ID: ${inboxId}`);

  logger.debug("[createXmtpClientFromXmtpSigner] Creating XMTP client");
  const client = await Client.create(signer, {
    ...options,
    preAuthenticateToInboxCallback,
  });
  logger.debug("[createXmtpClientFromXmtpSigner] XMTP client created");

  if (client.inboxId !== inboxId) {
    logger.error("[createXmtpClientFromXmtpSigner] Inbox ID mismatch", {
      clientInboxId: client.inboxId,
      expectedInboxId: inboxId,
    });
    throw new Error("Inbox ids don't match");
  }

  // In case we're logging with an existing libxmtp database, make sure
  // the installation has not already been revoked
  logger.debug(
    "[createXmtpClientFromXmtpSigner] Checking if installation is valid"
  );
  const installationValid = await isClientInstallationValid(client);

  if (!installationValid) {
    logger.warn(
      "[createXmtpClientFromXmtpSigner] Installation is not valid, cleaning up"
    );
    await client.dropLocalDatabaseConnection();
    await deleteLibXmtpDatabaseForInboxId(inboxId);
    logger.debug(
      "[createXmtpClientFromXmtpSigner] Calling onInstallationRevoked callback"
    );
    onInstallationRevoked();
    return;
  }

  logger.debug("[createXmtpClientFromXmtpSigner] Installation is valid");
};

export const createXmtpClientFromSigner = async (
  signer: Signer,
  onInstallationRevoked: () => Promise<void>,
  preAuthenticateToInboxCallback?: () => Promise<void>
) =>
  createXmtpClientFromXmtpSigner(
    ethersSignerToXmtpSigner(signer),
    onInstallationRevoked,
    preAuthenticateToInboxCallback
  );

export const createXmtpClientFromViemAccount = async (
  account: ViemAccount,
  onInstallationRevoked: () => Promise<void>,
  preAuthenticateToInboxCallback?: () => Promise<void>
) =>
  createXmtpClientFromXmtpSigner(
    viemAccountToXmtpSigner(account),
    onInstallationRevoked,
    preAuthenticateToInboxCallback
  );
