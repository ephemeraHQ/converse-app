import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
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
  return client;
};

export const xmtpClientByAccount: {
  [account: string]: Client;
} = {};

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
  });
