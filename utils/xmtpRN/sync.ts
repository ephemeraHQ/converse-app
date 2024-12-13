import logger from "@utils/logger";
import { retryWithBackoff } from "@utils/retryWithBackoff";
import { Client } from "@xmtp/xmtp-js";
import { AppState } from "react-native";
import { getChatStore } from "@data/store/accountsStore";
import {
  ConverseXmtpClientType,
  getXmtpClientFromAddress,
  reconnectXmtpClientsDbConnections,
  xmtpClientByAccount,
} from "./client";
import {
  stopStreamingConversations,
  streamConversations,
} from "./conversations";
import { stopStreamingAllMessage, streamAllMessages } from "./messages";
import {
  fetchPersistedConversationListQuery,
  prefetchConversationListQuery,
} from "@queries/useV3ConversationListQuery";
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription";

const instantiatingClientForAccount: {
  [account: string]: Promise<ConverseXmtpClientType | Client> | undefined;
} = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType | Client> => {
  const lowerCaseAccount = account.toLowerCase();
  if (account && xmtpClientByAccount[lowerCaseAccount]) {
    return xmtpClientByAccount[lowerCaseAccount];
  }
  // Return the existing instantiating promise to avoid race condition
  const alreadyInstantiating = instantiatingClientForAccount[lowerCaseAccount];
  if (alreadyInstantiating) {
    return alreadyInstantiating;
  }
  // Avoid instantiating any 2 clients at the same time to avoid
  // blocking the Expo Async Thread
  if (Object.keys(instantiatingClientForAccount).length > 0) {
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }
  instantiatingClientForAccount[lowerCaseAccount] = (async () => {
    try {
      logger.debug("[XmtpRN] Getting client from address");
      const client = await getXmtpClientFromAddress(account);
      logger.info(`[XmtpRN] Instantiated client for ${client.address}`);
      getChatStore(account).getState().setLocalClientConnected(true);
      getChatStore(account).getState().setErrored(false);
      xmtpClientByAccount[lowerCaseAccount] = client;
      return client;
    } catch (e: any) {
      getChatStore(account).getState().setErrored(true);
      throw e;
    } finally {
      delete instantiatingClientForAccount[lowerCaseAccount];
    }
  })();
  return instantiatingClientForAccount[lowerCaseAccount] as Promise<
    ConverseXmtpClientType | Client
  >;
};

export const onSyncLost = async (account: string, error: any) => {
  // If there is an error let's show it
  getChatStore(account).getState().setReconnecting(true);
  // If error is a libxmtp database reconnection issue, let's
  // try to reconnect if we're active
  if (
    `${error}`.includes("storage error: Pool needs to  reconnect before use")
  ) {
    if (AppState.currentState === "active") {
      logger.error(
        "Reconnecting XMTP Pool because it didn't reconnect automatically"
      );
      await reconnectXmtpClientsDbConnections();
      logger.debug("Done reconnecting XMTP Pool");
    } else if (AppState.currentState === "background") {
      // This error is normal when backgrounded, fail silently
      // as reopening the app will launch a resync
    } else {
      logger.error(error, {
        context: `An error occured while syncing for ${account}`,
      });
    }
  } else {
    logger.error(error, {
      context: `An error occured while syncing for ${account}`,
    });
  }
};

const streamingAccounts: { [account: string]: boolean } = {};

const syncClientConversationList = async (account: string) => {
  try {
    // Load the persisted conversation list
    await fetchPersistedConversationListQuery(account);
    // Streaming conversations
    await retryWithBackoff({
      fn: () => streamConversations(account),
      retries: 5,
      delay: 1000,
      factor: 2,
      maxDelay: 30000,
      context: `streaming conversations for ${account}`,
    }).catch((e) => {
      // Streams are good to have, but should not prevent the app from working
      logger.error(e, {
        context: `Failed to stream conversations for ${account} no longer retrying`,
      });
    });
    // Streaming all messages
    await retryWithBackoff({
      fn: () => streamAllMessages(account),
      retries: 5,
      delay: 1000,
      factor: 2,
      maxDelay: 30000,
      context: `streaming all messages for ${account}`,
    }).catch((e) => {
      // Streams are good to have, but should not prevent the app from working
      logger.error(e, {
        context: `Failed to stream all messages for ${account} no longer retrying`,
      });
    });
    // Prefetch the conversation list so when we land on the conversation list
    // we have it ready, this will include syncing all groups
    setupAccountTopicSubscription(account);
    await prefetchConversationListQuery(account);
  } catch (e) {
    logger.error(e, {
      context: `Failed to fetch persisted conversation list for ${account}`,
    });
  }
};

export const syncConversationListXmtpClient = async (account: string) => {
  return retryWithBackoff({
    fn: () => syncClientConversationList(account),
    retries: 5,
    delay: 1000,
    factor: 2,
    maxDelay: 30000,
    context: `syncing ${account}`,
    onError: async (e) => {
      await onSyncLost(account, e);
    },
  });
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
  }
  delete xmtpClientByAccount[account];
  delete instantiatingClientForAccount[account];
  delete streamingAccounts[account];
};
