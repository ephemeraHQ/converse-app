import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription";

import { getChatStore } from "@data/store/accountsStore";
import logger from "@utils/logger";
import { retryWithBackoff } from "@utils/retryWithBackoff";
import { AppState } from "react-native";
import {
  getXmtpClientFromAddress,
  reconnectXmtpClientsDbConnections,
  xmtpClientByAccount,
} from "./client";
import { ConverseXmtpClientType } from "./client.types";
import {
  stopStreamingConversations,
  streamConversations,
} from "./conversations";
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "./xmtp-messages/xmtp-messages-stream";

const instantiatingClientForAccount: {
  [account: string]: Promise<ConverseXmtpClientType> | undefined;
} = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType> => {
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
      xmtpClientByAccount[lowerCaseAccount] = client;
      return client;
    } catch (e: unknown) {
      throw e;
    } finally {
      delete instantiatingClientForAccount[lowerCaseAccount];
    }
  })();
  return instantiatingClientForAccount[
    lowerCaseAccount
  ] as Promise<ConverseXmtpClientType>;
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
