import config from "../config";
import {
  Client,
  InMemoryKeystore,
  PrivateKeyBundle,
} from "../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

export const getXmtpClientFromKeys = (keys: any) =>
  Client.create(null, {
    privateKeyOverride: Buffer.from(keys),
    env,
  });

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
