import { config } from "@/config";
import { getDbDirectory } from "@/data/db";
import { captureError } from "@/utils/capture-error";
import { getCleanEthAddress } from "@/utils/evm/address";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
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
  return Client.dropClient(installationId);
}

export async function deleteXmtpClient({ address }: { address: string }) {
  const cleanedEthAddress = getCleanEthAddress(address);
  if (cleanedEthAddress in xmtpClientByEthAddress) {
    stopStreamingAllMessage(address);
    stopStreamingConversations(address);
    stopStreamingConsent(address);
  }
  delete xmtpClientByEthAddress[cleanedEthAddress];
}

export async function getXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId: InboxId;
}) {
  const cleanedEthAddress = getCleanEthAddress(address);

  if (cleanedEthAddress in xmtpClientByEthAddress) {
    return xmtpClientByEthAddress[cleanedEthAddress];
  }

  try {
    const buildClientPromise = buildXmtpClient({
      address,
      inboxId,
    });

    xmtpClientByEthAddress[cleanedEthAddress] = buildClientPromise;

    const client = await buildClientPromise;

    xmtpClientByEthAddress[cleanedEthAddress] = client;
    return client;
  } catch (error) {
    delete xmtpClientByEthAddress[cleanedEthAddress];
    throw error;
  }
}

async function buildXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId: InboxId;
}) {
  const startTime = Date.now();
  try {
    logger.debug(
      `[buildXmtpClient] Starting to build XMTP client with address: ${address} and inboxId: ${inboxId}`
    );

    const [dbDirectory, dbEncryptionKey] = await Promise.all([
      getDbDirectory(),
      getDbEncryptionKey(),
    ]);

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
      `[buildXmtpClient] Successfully built XMTP client for address: ${address} (took ${duration}ms)`
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
    throw error;
  }
}
