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

import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";
import config from "../../config";
import { getDbDirectory } from "../../data/db";
import { getCleanAddress } from "../eth";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpClientFromBase64Key = async (base64Key: string) => {
  const dbDirectory = await getDbDirectory();

  return Client.createFromKeyBundle(base64Key, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new GroupUpdatedCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      new TransactionReferenceCodec(),
      new CoinbaseMessagingPaymentCodec(),
    ],
    enableV3: true,
    dbDirectory,
    historySyncUrl: config.historySyncUrl,
  });
};

export type ConverseXmtpClientType = Awaited<
  ReturnType<typeof getXmtpClientFromBase64Key>
>;

export type ConversationWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newConversation"]>
>;

export type GroupWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newGroup"]>
>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
  });

export const xmtpClientByAccount: {
  [account: string]: ConverseXmtpClientType;
} = {};

// On iOS, it's important to stop writing to SQLite database
// when the app is going from BACKGROUNDED to SUSPENDED
// (see https://github.com/xmtp/xmtp-ios/issues/336)

// There are currently 2 SQLite databases:
// 1st one managed by Converse, created to store v2 XMTP data
// 2nd one managed by LibXMTP, created to store v3 XMTP data

// Let's just stop writing to both of them as soon as the app is BACKGROUNDED

export const dropXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByAccount).map((c) =>
      c.dropLocalDatabaseConnection()
    )
  );
};

export const reconnectXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByAccount).map((c) => c.reconnectLocalDatabase())
  );
};
