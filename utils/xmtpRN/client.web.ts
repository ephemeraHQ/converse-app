import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { Client } from "@xmtp/xmtp-js";
import { Signer } from "ethers";

import config from "../../config";
import { getCleanAddress } from "../eth";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const keys = await Client.getKeys(signer, {
    env,
    // we don't need to publish the contact here since it
    // will happen when we create the client later
    skipContactPublishing: true,
    // we can skip persistence on the keystore for this short-lived
    // instance
    persistConversations: false,
  });
  const base64Key = Buffer.from(keys).toString("base64");
  return base64Key;
};

export const getXmtpClientFromBase64Key = async (base64Key: string) => {
  const client = await Client.create(null, {
    env,
    privateKeyOverride: Buffer.from(base64Key, "base64"),
  });
  client.registerCodec(new ReactionCodec());
  client.registerCodec(new AttachmentCodec());
  client.registerCodec(new RemoteAttachmentCodec());
  client.registerCodec(new ReadReceiptCodec());
  client.registerCodec(new TransactionReferenceCodec());
  // client.registerCodec(new CoinbaseMessagingPaymentCodec());
  /* TODO - this fails with error:
  Argument of type 'CoinbaseMessagingPaymentCodec' is not assignable to
  parameter of type 'ContentCodec<any>'.
  Types of property 'contentType' are incompatible.
  Property 'sameAs' is missing in type
  */
  return client;
};

export const xmtpClientByAccount: {
  [account: string]: Client;
} = {};

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
  });
