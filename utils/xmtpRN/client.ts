import * as secp from "@noble/secp256k1";
import { privateKey, signature } from "@xmtp/proto";
import { Client } from "@xmtp/react-native-sdk";

import config from "../../config";
import { getChatStore, getUserStore } from "../../data/store/accountsStore";
import { loadXmtpKey } from "../keychain";
import {
  deleteOpenedConversations,
  loadConversations,
  stopStreamingConversations,
  streamConversations,
} from "./conversations";
import {
  loadConversationsMessages,
  stopStreamingAllMessage,
  streamAllMessages,
} from "./messages";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const isOnXmtp = async (account: string, address: string) => {
  const client = await getXmtpClient(account);
  return client.canMessage(address);
};

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, { env });

const xmtpClientByAccount: { [account: string]: Client } = {};
const xmtpSignatureByAccount: { [account: string]: string } = {};

export const getXmtpClient = async (account: string) => {
  console.log(`[XmtpRN] Getting client for ${account}`);
  if (account && xmtpClientByAccount[account]) {
    return xmtpClientByAccount[account];
  }
  const base64Key = await loadXmtpKey(account);
  if (base64Key) {
    const client = await getXmtpClientFromBase64Key(base64Key);
    console.log(`[XmtpRN] Instantiated client for ${client.address}`);
    getUserStore(account).getState().setUserAddress(client.address);
    getChatStore(account).getState().setLocalClientConnected(true);
    xmtpClientByAccount[client.address] = client;
    return client;
  }
  throw new Error(`[XmtpRN] No client found for ${account}`);
};

export const syncXmtpClient = async (
  account: string,
  knownTopics: string[],
  lastSyncedAt: number
) => {
  console.log(`[XmtpRN] Syncing ${account}`);
  const now = new Date().getTime();
  const client = await getXmtpClient(account);
  const { newConversations, knownConversations } = await loadConversations(
    client,
    knownTopics
  );

  const promises = [];

  if (knownConversations.length > 0) {
    promises.push(
      loadConversationsMessages(client, knownConversations, lastSyncedAt)
    );
  }

  if (newConversations.length > 0) {
    promises.push(loadConversationsMessages(client, newConversations, 0));
  }

  streamAllMessages(client);
  streamConversations(client);

  await Promise.all(promises);

  // Need to save initial load is done
  getChatStore(account).getState().setInitialLoadDone();
  getChatStore(account).getState().setLastSyncedAt(now);
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    const client = xmtpClientByAccount[account];
    stopStreamingAllMessage(client);
    stopStreamingConversations(client);
    delete xmtpClientByAccount[account];
    deleteOpenedConversations(account);
    delete xmtpSignatureByAccount[account];
  }
};

export const getXmtpApiSignature = async (account: string, message: string) => {
  const messageToSign = Buffer.from(message);
  const base64Key = await loadXmtpKey(account);
  if (!base64Key)
    throw new Error(`Cannot create signature for ${account}: no key found`);

  const privateKeyBundle = privateKey.PrivateKeyBundle.decode(
    Buffer.from(base64Key, "base64")
  );
  const privateKeySecp256k1 =
    privateKeyBundle.v1?.identityKey?.secp256k1 ||
    privateKeyBundle.v2?.identityKey?.secp256k1;
  if (!privateKeySecp256k1)
    throw new Error("Could not extract private key from private key bundle");

  const [signedBytes, recovery] = await secp.sign(
    messageToSign,
    privateKeySecp256k1.bytes,
    {
      recovered: true,
      der: false,
    }
  );
  const signatureProto = signature.Signature.fromPartial({
    ecdsaCompact: { bytes: signedBytes, recovery },
  });
  const encodedSignature = Buffer.from(
    signature.Signature.encode(signatureProto).finish()
  ).toString("base64");
  return encodedSignature;
};

export const getXmtpApiHeaders = async (account: string) => {
  if (account in xmtpSignatureByAccount)
    return {
      "xmtp-api-signature": xmtpSignatureByAccount[account],
      "xmtp-api-address": account,
    };
  const xmtpApiSignature = await getXmtpApiSignature(account, "XMTP_IDENTITY");
  xmtpSignatureByAccount[account] = xmtpApiSignature;
  return {
    "xmtp-api-signature": xmtpApiSignature,
    "xmtp-api-address": account,
  };
};
