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
import { Cryptocurrency } from "@/features/profiles/profile-types";

const env = config.xmtpEnv as "dev" | "production" | "local";

/**
 * Lots of interest and chatter about adding multiple cryptocurrency wallets, and there is no reason why
 * the signer must be associated with a cryptocurrency wallet, but rather just a properly structure
 * keypair.
 *
 * This little bit of extra setup creates an easier on ramp once that is eventually supported.
 *
 * @see below for furthing reading
 *
 * https://github.com/xmtp/XIPs/blob/main/XIPs/xip-46-multi-wallet-identity.md
 * https://xmtp-labs.slack.com/archives/C02BPH2ARME/p1734044409726109?thread_ts=1734040726.040939&cid=C02BPH2ARME
 * https://xmtp-labs.slack.com/archives/C05GBHEAGPP/p1735858759278859?thread_ts=1735857229.503269&cid=C05GBHEAGPP
 */
export const getInboxIdFromCryptocurrencyAddress = async ({
  address,
  cryptocurrency,
}: {
  address: string;
  cryptocurrency: Cryptocurrency;
}) => {
  if (cryptocurrency === "ETH") {
    const rawInboxId = await Client.getOrCreateInboxId(address, env);
    return rawInboxId.toLowerCase();
  }
  throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
};

type CreateXmtpClientFromSignerResult =
  | {
      inboxId: string;
    }
  | {
      error: Error;
    };

export const createXmtpClientFromSigner = async (
  signer: Signer,
  onInstallationRevoked: () => Promise<void>,
  preAuthenticateToInboxCallback?: () => Promise<void>
): Promise<CreateXmtpClientFromSignerResult> => {
  const tempDirectory = await createTemporaryDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  const options = {
    env,
    enableV3: true,
    dbDirectory: tempDirectory,
    dbEncryptionKey,
  };
  const inboxId = await getInboxIdFromCryptocurrencyAddress({
    address: await signer.getAddress(),
    cryptocurrency: "ETH",
  });

  await copyDatabasesToTemporaryDirectory(tempDirectory, inboxId);

  logger.debug("Instantiating client from signer");

  const client = await Client.create(ethersSignerToXmtpSigner(signer), {
    ...options,
    preAuthenticateToInboxCallback,
  });

  if (client.inboxId !== inboxId) {
    // how the hell would this happen?
    throw new Error("Inbox ids don't match");
  }

  // In case we're logging with an existing libxmtp database, make sure
  // the installation has not already been revoked
  const installationValid = await isClientInstallationValid(client);
  if (!installationValid) {
    await client.dropLocalDatabaseConnection();
    await deleteLibXmtpDatabaseForInboxId(inboxId);
    onInstallationRevoked();
    return { error: new Error("Installation revoked") };
  }

  logger.debug("Instantiated client from signer");
  // This Client is only be used to extract the key, we can disconnect
  // it to prevent locks happening during Onboarding
  await client.dropLocalDatabaseConnection();
  await moveTemporaryDatabasesToDatabaseDirectory(
    tempDirectory,
    client.inboxId
  );
  logger.debug("Dropped client databases");

  return { inboxId };
};
