import { Signer } from "ethers";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";

import config from "../../config";
import { Client } from "../../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export type TimestampByConversation = { [topic: string]: number };

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

export const getXmtpClientFromKeys = async (keys: any) => {
  const client = await Client.create(null, {
    privateKeyOverride: Buffer.from(keys),
    env,
  });
  client.registerCodec(new AttachmentCodec());
  client.registerCodec(new RemoteAttachmentCodec());
  return client;
};

export const getXmtpKeysFromSigner = (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) =>
  Client.getKeys(signer, {
    env,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
  });
