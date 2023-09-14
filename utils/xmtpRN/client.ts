import * as secp from "@noble/secp256k1";
import { privateKey, signature } from "@xmtp/proto";
import { Client } from "@xmtp/react-native-sdk";

import config from "../../config";
import { getChatStore, getUserStore } from "../../data/store/accountsStore";
import { getTopicDataFromKeychain, loadXmtpKey } from "../keychain";
import { sentryTrackError } from "../sentry";
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

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, { env });

const xmtpClientByAccount: { [account: string]: Client } = {};
const xmtpSignatureByAccount: { [account: string]: string } = {};
const importedTopicDataByAccount: { [account: string]: boolean } = {};
const instantiatingClientForAccount: { [account: string]: boolean } = {};

export const getXmtpClient = async (account: string): Promise<Client> => {
  console.log(`[XmtpRN] Getting client for ${account}`);
  if (account && xmtpClientByAccount[account]) {
    return xmtpClientByAccount[account];
  }
  if (instantiatingClientForAccount[account]) {
    // Avoid instantiating 2 clients for the same account
    // which leads to buggy behaviour
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }
  instantiatingClientForAccount[account] = true;
  try {
    const base64Key = await loadXmtpKey(account);
    if (base64Key) {
      const client = await getXmtpClientFromBase64Key(base64Key);
      console.log(`[XmtpRN] Instantiated client for ${client.address}`);
      getUserStore(account).getState().setUserAddress(client.address);
      getChatStore(account).getState().setLocalClientConnected(true);
      xmtpClientByAccount[client.address] = client;
      delete instantiatingClientForAccount[account];
      return client;
    }
  } catch (e) {
    delete instantiatingClientForAccount[account];
    throw e;
  }
  delete instantiatingClientForAccount[account];
  throw new Error(`[XmtpRN] No client found for ${account}`);
};

const importTopicData = async (client: Client, topics: string[]) => {
  if (client.address in importedTopicDataByAccount) return;
  importedTopicDataByAccount[client.address] = true;
  // If we have topics for this account, let's import them
  // so the first conversation.list() is faster
  const beforeImport = new Date().getTime();
  const topicsData = await getTopicDataFromKeychain(client.address, topics);
  if (topicsData.length > 0) {
    try {
      await topicsData.map((data) =>
        client.conversations.importTopicData(data)
      );
      const afterImport = new Date().getTime();
      console.log(
        `[XmtpRN] Imported ${
          topicsData.length
        } exported conversations into client in ${
          (afterImport - beforeImport) / 1000
        }s`
      );
    } catch (e) {
      console.log(e);
      // It's ok if import failed it will just be slower
      sentryTrackError(e);
    }
  }
};

const onSyncLost = async (account: string, error: any) => {
  console.log(
    `[XmtpRN] An error occured while syncing for ${account}: ${error}`
  );
  // If there is an error let's show it
  getChatStore(account).getState().setReconnecting(true);
  // Wait a bit before reco
  await new Promise((r) => setTimeout(r, 1000));
  // Now let's reload !
  syncXmtpClient(account);
};

export const syncXmtpClient = async (account: string) => {
  const knownTopics = Object.keys(
    getChatStore(account).getState().conversations
  );
  const lastSyncedAt = getChatStore(account).getState().lastSyncedAt;
  console.log(`[XmtpRN] Syncing ${account}`, {
    lastSyncedAt,
    knownTopics: knownTopics.length,
  });
  const client = await getXmtpClient(account);
  await importTopicData(client, knownTopics);
  try {
    const now = new Date().getTime();
    const { newConversations, knownConversations } = await loadConversations(
      client,
      knownTopics
    );
    // As soon as we have done one query we can hide reconnecting
    getChatStore(account).getState().setReconnecting(false);
    const promises = [];

    if (knownConversations.length > 0) {
      promises.push(
        loadConversationsMessages(client, knownConversations, lastSyncedAt)
      );
    }

    if (newConversations.length > 0) {
      promises.push(loadConversationsMessages(client, newConversations, 0));
    }

    streamAllMessages(client).catch((e) => {
      onSyncLost(account, e);
    });
    streamConversations(client).catch((e) => {
      onSyncLost(account, e);
    });

    await Promise.all(promises);

    // Need to save initial load is done
    getChatStore(account).getState().setInitialLoadDone();
    getChatStore(account).getState().setLastSyncedAt(now);
  } catch (e) {
    onSyncLost(account, e);
  }
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    const client = xmtpClientByAccount[account];
    stopStreamingAllMessage(client);
    stopStreamingConversations(client);
    delete xmtpClientByAccount[account];
    deleteOpenedConversations(account);
    delete xmtpSignatureByAccount[account];
    delete importedTopicDataByAccount[account];
    delete instantiatingClientForAccount[account];
  }
};

const getXmtpApiSignature = async (account: string, message: string) => {
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
