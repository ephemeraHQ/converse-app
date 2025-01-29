import { config } from "@/config";
import { getDbDirectory } from "@/data/db";
import { captureError } from "@/utils/capture-error";
import { getCleanEthAddress } from "@/utils/evm/address";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  Client,
  GroupUpdatedCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import {
  InboxId,
  InstallationId,
} from "@xmtp/react-native-sdk/build/lib/Client";
import { CoinbaseMessagingPaymentCodec } from "../xmtp-content-types/xmtp-coinbase-payment";

// Supported message codecs for XMTP client
const codecs = [
  new TextCodec(),
  new ReactionCodec(),
  new ReadReceiptCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
  new TransactionReferenceCodec(),
  new CoinbaseMessagingPaymentCodec(),
];

const xmtpClientByEthAddress: Record<
  string,
  ConverseXmtpClientType | Promise<ConverseXmtpClientType>
> = {};

export function dropXmtpClient(installationId: InstallationId) {
  logger.debug(
    `[dropXmtpClient] Dropping client with installationId: ${JSON.stringify(installationId, null, 2)}`
  );
  return Client.dropClient(installationId);
}

export async function deleteXmtpClient({ address }: { address: string }) {
  const cleanedEthAddress = getCleanEthAddress(address);
  logger.debug(
    `[deleteXmtpClient] Deleting client for address: ${cleanedEthAddress}`
  );
  delete xmtpClientByEthAddress[cleanedEthAddress];
}

export async function getXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId?: InboxId;
}) {
  const cleanedEthAddress = getCleanEthAddress(address);
  logger.debug(
    `[getXmtpClient] Getting client with params: ${JSON.stringify({ address: cleanedEthAddress, inboxId }, null, 2)}`
  );

  if (cleanedEthAddress in xmtpClientByEthAddress) {
    logger.debug(
      `[getXmtpClient] Found existing client for address: ${cleanedEthAddress}`
    );
    return xmtpClientByEthAddress[cleanedEthAddress];
  }

  try {
    const buildClientPromise = buildXmtpClient({
      address,
      inboxId,
    });

    xmtpClientByEthAddress[cleanedEthAddress] = buildClientPromise;

    const client = await buildClientPromise;
    logger.debug(
      `[getXmtpClient] Built new client for address: ${cleanedEthAddress}`
    );

    xmtpClientByEthAddress[cleanedEthAddress] = client;
    return client;
  } catch (error) {
    logger.debug(
      `[getXmtpClient] Error building client: ${JSON.stringify(error, null, 2)}`
    );
    delete xmtpClientByEthAddress[cleanedEthAddress];
    throw error;
  }
}

async function buildXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId?: InboxId;
}) {
  const startTime = Date.now();
  try {
    logger.debug(
      `[buildXmtpClient] Starting to build XMTP client with params: ${JSON.stringify({ address, inboxId }, null, 2)}`
    );

    const [dbDirectory, dbEncryptionKey] = await Promise.all([
      getDbDirectory(),
      getDbEncryptionKey(),
    ]);

    logger.debug(
      `[buildXmtpClient] Got DB info: ${JSON.stringify({ dbDirectory, dbEncryptionKey }, null, 2)}`
    );

    const client = await Client.build(
      address,
      {
        env: config.xmtpEnv,
        codecs,
        dbDirectory,
        dbEncryptionKey,
      },
      inboxId
    );

    const duration = Date.now() - startTime;
    logger.debug(
      `[buildXmtpClient] Successfully built XMTP client with config: ${JSON.stringify(
        {
          address,
          env: config.xmtpEnv,
          codecs: codecs.map((c) => c.constructor.name),
          dbDirectory,
          duration: `${duration}ms`,
        },
        null,
        2
      )}`
    );

    if (duration > 1000) {
      captureError(
        new Error(
          `[buildXmtpClient] Building XMTP client took more than 1 second (${duration}ms) for address: ${address}`
        )
      );
    }

    return client;
  } catch (error) {
    logger.debug(`[buildXmtpClient] Error: ${JSON.stringify(error, null, 2)}`);
    throw error;
  }
}
