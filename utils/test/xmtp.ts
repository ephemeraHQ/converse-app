import { type XmtpEnv, Client, Signer } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";

import { saveXmtpKeys } from "./../keychain/helpers";
import { getInboxIdFromCryptocurrencyAddress } from "../xmtpRN/signIn";

export function randomWallet(): Wallet {
  return Wallet.createRandom();
}

export async function saveKeys(signer: Signer, env: XmtpEnv) {
  const keys = await Client.getKeys(signer, { env });
  const base64Keys = Buffer.from(keys).toString("base64");
  const ethereumAddress = await signer.getAddress();
  const inboxId = await getInboxIdFromCryptocurrencyAddress({
    address: ethereumAddress,
    cryptocurrency: "ETH",
  });
  await saveXmtpKeys({ inboxId, base64Keys });
}

export async function randomClient(env: XmtpEnv): Promise<Client> {
  const signer = randomWallet();
  const client = await Client.create(signer, { env });
  return client;
}
