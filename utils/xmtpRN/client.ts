import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  Client,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";

import config from "../../config";
import { getCleanAddress } from "../eth";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      new TransactionReferenceCodec(),
      new CoinbaseMessagingPaymentCodec(),
      // new ReplyCodec()
    ],
  });

export type ConverseXmtpClientType = Awaited<
  ReturnType<typeof getXmtpClientFromBase64Key>
>;

export type ConversationWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newConversation"]>
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
