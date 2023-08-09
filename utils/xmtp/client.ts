import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";

import config from "../../config";
import { Client, Signer } from "../../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

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
  client.registerCodec(new ReactionCodec());
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
