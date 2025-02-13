import { config } from "@/config";
import { captureError } from "@/utils/capture-error";
import { getCleanEthAddress } from "@/utils/evm/address";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { getDbEncryptionKey } from "@/utils/xmtp-db-encryption-key";
import { logger } from "@utils/logger";
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
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

// Supported message codecs for XMTP client
export const codecs = [
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

export async function getXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId?: InboxId;
}) {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: address,
  });
  if (!client) {
    throw new Error("Client undefined");
  }
  return client;
  const cleanedEthAddress = getCleanEthAddress(address);

  // if (cleanedEthAddress in xmtpClientByEthAddress) {
  //   return xmtpClientByEthAddress[cleanedEthAddress];
  // }

  // try {
  //   const buildClientPromise = buildXmtpClient({
  //     address,
  //     inboxId,
  //   });

  //   xmtpClientByEthAddress[cleanedEthAddress] = buildClientPromise;

  //   const client = await buildClientPromise;

  //   xmtpClientByEthAddress[cleanedEthAddress] = client;
  //   return client;
  // } catch (error) {
  //   delete xmtpClientByEthAddress[cleanedEthAddress];
  //   throw error;
  // }
}

// async function buildXmtpClient({
//   address,
//   inboxId,
// }: {
//   address: string;
//   inboxId?: InboxId;
// }) {
//   const startTime = Date.now();
//   try {
//     logger.debug(
//       `[buildXmtpClient] Starting to build XMTP client with address: ${address} and inboxId: ${inboxId}`
//     );

//     const dbEncryptionKey = await getDbEncryptionKey();

//     const client = await Client.build(
//       address,
//       {
//         env: config.xmtpEnv,
//         codecs,
//         dbEncryptionKey,
//       },
//       inboxId
//     );

//     const duration = Date.now() - startTime;
//     logger.debug(
//       `[buildXmtpClient] Successfully built XMTP client for address: ${address} (took ${duration}ms)`
//     );

//     if (duration > 1000) {
//       captureError(
//         new Error(
//           `[buildXmtpClient] Building XMTP client took more than 1 second (${duration}ms) for address: ${address}`
//         )
//       );
//     }

//     return client;
//   } catch (error) {
//     throw error;
//   }
// }
