import { Client, Signer } from "@xmtp/xmtp-js";
import { getAddress } from "ethers/lib/utils";

import config from "../../config";

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

export const getXmtpKeysFromSigner = (signer: Signer) =>
  Client.getKeys(signer, {
    env,
  });

export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`;

export const buildUserInviteTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`invite-${getAddress(walletAddr)}`);
};
