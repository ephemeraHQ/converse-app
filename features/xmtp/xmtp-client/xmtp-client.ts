import { InboxId, Client as XmtpClient } from "@xmtp/react-native-sdk";
import { getRandomBytesAsync } from "expo-crypto";
import { config } from "@/config";
import { enhanceError } from "@/utils/error";
import { getSecureItemAsync, setSecureItemAsync } from "@/utils/keychain";
import { logger } from "@/utils/logger";
import {
  ISupportedXmtpCodecs,
  supportedXmtpCodecs,
} from "../xmtp-codecs/xmtp-codecs";
import { IXmtpClient, IXmtpSigner } from "../xmtp.types";

export async function createXmtpClientInstance(args: {
  inboxSigner: IXmtpSigner;
}): Promise<IXmtpClient> {
  const { inboxSigner } = args;

  logger.debug(`[createXmtpClientInstance] Creating new XMTP client`);

  try {
    return await XmtpClient.create<ISupportedXmtpCodecs>(inboxSigner, {
      env: config.xmtpEnv,
      dbEncryptionKey: await getDbEncryptionKey(),
      codecs: supportedXmtpCodecs,
    });
  } catch (error) {
    throw enhanceError(error, "Failed to create XMTP client instance");
  }
}

export async function buildXmtpClientInstance(args: {
  ethereumAddress: string;
  inboxId?: InboxId;
}): Promise<IXmtpClient> {
  const { ethereumAddress, inboxId } = args;
  try {
    return await XmtpClient.build<ISupportedXmtpCodecs>(
      ethereumAddress,
      {
        env: config.xmtpEnv,
        codecs: supportedXmtpCodecs,
        dbEncryptionKey: await getDbEncryptionKey(),
      },
      inboxId,
    );
  } catch (error) {
    throw enhanceError(
      error,
      `Failed to build XMTP client for address: ${ethereumAddress}`,
    );
  }
}

async function getDbEncryptionKey() {
  const DB_ENCRYPTION_KEY = "LIBXMTP_DB_ENCRYPTION_KEY";

  logger.debug("[getDbEncryptionKey] Getting DB encryption key");
  const existingKey = await getSecureItemAsync(DB_ENCRYPTION_KEY);

  if (existingKey) {
    logger.debug("[getDbEncryptionKey] Found existing DB encryption key");
    return new Uint8Array(Buffer.from(existingKey, "base64"));
  }

  logger.debug("[getDbEncryptionKey] Creating new DB encryption key");
  const newKey = Buffer.from(await getRandomBytesAsync(32));
  await setSecureItemAsync(DB_ENCRYPTION_KEY, newKey.toString("base64"));

  return new Uint8Array(newKey);
}
