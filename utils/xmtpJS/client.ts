import config from "../../config";
import { Client, Signer } from "../../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

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
