import * as secp from "@noble/secp256k1";
import { privateKey, signature } from "@xmtp/proto";
import {
  Client,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

import config from "../../config";
import { refreshAllSpamScores } from "../../data/helpers/conversations/spamScore";
import { getChatStore } from "../../data/store/accountsStore";
import { getCleanAddress } from "../eth";
import { loadXmtpKey } from "../keychain/helpers";
// import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";
import {
  deleteOpenedConversations,
  loadConversations,
  stopStreamingConversations,
  streamConversations,
  updateConsentStatus,
} from "./conversations";
import {
  loadConversationsMessages,
  stopStreamingAllMessage,
  streamAllMessages,
} from "./messages";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const client = await Client.create(signer, {
    env,
    preCreateIdentityCallback,
    preEnableIdentityCallback,
  });
  const key = await client.exportKeyBundle();
  return key;
};

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      // new CoinbaseMessagingPaymentCodec(),
      // new ReplyCodec()
    ],
  });

export type ConverseXmtpClientType = Awaited<
  ReturnType<typeof getXmtpClientFromBase64Key>
>;

export type ConversationWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newConversation"]>
>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
  });

const xmtpClientByAccount: { [account: string]: ConverseXmtpClientType } = {};
const xmtpSignatureByAccount: { [account: string]: string } = {};
const instantiatingClientForAccount: { [account: string]: boolean } = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType> => {
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

const streamingAccounts: { [account: string]: boolean } = {};

export const syncXmtpClient = async (account: string) => {
  const lastSyncedAt = getChatStore(account).getState().lastSyncedAt || 0;

  // We just introduced lastSyncedTopics so it might be empty at first
  // Last synced topics enable us not to miss messages from new conversations
  // That we didn't get through notifications
  const lastSyncedTopics =
    getChatStore(account).getState().lastSyncedTopics || [];
  const knownTopics =
    lastSyncedTopics.length > 0
      ? lastSyncedTopics
      : Object.keys(getChatStore(account).getState().conversations);
  console.log(`[XmtpRN] Syncing ${account}`, {
    lastSyncedAt,
    knownTopics: knownTopics.length,
  });
  const client = await getXmtpClient(account);
  const queryConversationsFromTimestamp: { [topic: string]: number } = {};
  knownTopics.forEach((topic) => {
    queryConversationsFromTimestamp[topic] = lastSyncedAt;
  });
  try {
    const now = new Date().getTime();
    updateConsentStatus(client);
    const { newConversations } = await loadConversations(client, knownTopics);
    newConversations.forEach((c) => {
      queryConversationsFromTimestamp[c.topic] = 0;
    });
    // As soon as we have done one query we can hide reconnecting
    getChatStore(account).getState().setReconnecting(false);

    streamAllMessages(client).catch((e) => {
      onSyncLost(account, e);
    });
    streamConversations(client).catch((e) => {
      onSyncLost(account, e);
    });
    streamingAccounts[client.address] = true;
    const topicsToQuery = Object.keys(queryConversationsFromTimestamp);

    const fetchedMessagesCount = await loadConversationsMessages(
      client,
      queryConversationsFromTimestamp
    );

    // Refresh spam scores after the initial load of conversation data is complete
    // Ensure spam scores are current, reflecting any new messages received since the last sync
    if (!getChatStore(account).getState().initialLoadDone) {
      await refreshAllSpamScores(account);
    }

    // Need to save initial load is done
    getChatStore(account).getState().setInitialLoadDone();
    // Only update when we have really fetched, this might mitigate
    // the case where we never fetch some messages
    if (fetchedMessagesCount > 0) {
      getChatStore(account).getState().setLastSyncedAt(now, topicsToQuery);
    }
    console.log(`[XmtpRN] Finished syncing ${account}`);
  } catch (e) {
    onSyncLost(account, e);
  }
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    const client = xmtpClientByAccount[account];
    stopStreamingAllMessage(client);
    stopStreamingConversations(client);
  }
  delete xmtpClientByAccount[account];
  deleteOpenedConversations(account);
  delete xmtpSignatureByAccount[account];
  delete instantiatingClientForAccount[account];
  delete streamingAccounts[account];
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
