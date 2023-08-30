import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";

import config from "../../config";
import {
  Client,
  InMemoryKeystore,
  PrivateKeyBundle,
  Signer,
} from "../../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

export const getXmtpClientFromBase64Key = async (base64Key: any) => {
  const client = await Client.create(null, {
    privateKeyOverride: Buffer.from(base64Key, "base64"),
    env,
  });
  client.registerCodec(new AttachmentCodec());
  client.registerCodec(new RemoteAttachmentCodec());
  client.registerCodec(new ReactionCodec());
  return client;
};

export const getXmtpKeysFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const keys = await Client.getKeys(signer, {
    env,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
  });
  return Buffer.from(keys);
};

export const getXmtpSignature = async (client: Client, message: string) => {
  const messageToSign = Buffer.from(message);
  let signature = "";
  if (client.keystore instanceof InMemoryKeystore) {
    const keys = (client.keystore as any).v1Keys as PrivateKeyBundle;
    signature = Buffer.from(
      (await keys.identityKey.sign(messageToSign)).toBytes()
    ).toString("base64");
  }
  return signature;
};
