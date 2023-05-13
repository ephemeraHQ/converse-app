import { Signer } from "ethers";

import config from "../../config";
import { Client } from "../../vendor/xmtp-js/src";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export type TimestampByConversation = { [topic: string]: number };

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

export const getXmtpClientFromKeys = (keys: any) =>
  Client.create(null, {
    privateKeyOverride: Buffer.from(keys),
    env,
  });

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
