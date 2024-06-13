import { type XmtpEnv, Client, Signer } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";

import { saveXmtpKey } from "./../keychain/helpers";

export function randomWallet(): Wallet {
  return Wallet.createRandom();
}

export async function saveKeys(signer: Signer, env: XmtpEnv) {
  const keys = await Client.getKeys(signer, { env });
  const base64Keys = Buffer.from(keys).toString("base64");
  await saveXmtpKey(await signer.getAddress(), base64Keys);
}

export async function randomClient(env: XmtpEnv): Promise<Client> {
  const signer = randomWallet();
  await saveKeys(signer, env);
  const client = await Client.create(signer, { env });
  return client;
}
