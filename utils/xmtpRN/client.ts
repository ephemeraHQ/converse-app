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

import config from "../../config";
import { getDbDirectory } from "../../data/db";
import { getCleanAddress } from "../eth";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";

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
