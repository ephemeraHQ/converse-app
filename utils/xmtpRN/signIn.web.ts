import { Client } from "@xmtp/xmtp-js";
import { Signer } from "ethers";

import config from "../../config";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const keys = await Client.getKeys(signer, {
    env,
    // we can skip persistence on the keystore for this short-lived
    // instance
    persistConversations: false,
    codecs: [new CoinbaseMessagingPaymentCodec()],
    preCreateIdentityCallback,
    preEnableIdentityCallback,
  });
  const base64Key = Buffer.from(keys).toString("base64");
  return base64Key;
};
