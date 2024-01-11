import { Client } from "@xmtp/xmtp-js";
import { Signer } from "ethers";

import config from "../../config";

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

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.create(null, {
    env,
    privateKeyOverride: Buffer.from(base64Key, "base64"),
  });

export const xmtpClientByAccount: {
  [account: string]: Client;
} = {};
