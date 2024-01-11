import {
  Client,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

import config from "../../config";
import { getCleanAddress } from "../eth";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const client = await Client.create(signer, {
    env,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
  });
  const key = await client.exportKeyBundle();
  return key;
};

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      // new CoinbaseMessagingPaymentCodec(),
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
