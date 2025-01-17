import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription";
import { captureError } from "@/utils/capture-error";
import logger from "@utils/logger";
import { retryWithBackoff } from "@utils/retryWithBackoff";
import { getXmtpClientFromAddress, xmtpClientByAccount } from "./client/client";
import { ConverseXmtpClientType } from "./client/client.types";
import {
  stopStreamingConversations,
  streamConversations,
} from "./xmtp-conversations/xmtp-conversations-stream";
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "./xmtp-messages/xmtp-messages-stream";
import {
  stopStreamingConsent,
  streamConsent,
} from "./xmtp-preferences/xmtp-preferences-stream";

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

    await retryWithBackoff({
      fn: () => streamConsent(account),
      retries: 5,
      delay: 1000,
      factor: 2,
      maxDelay: 30000,
      context: `streaming consent for ${account}`,
    }).catch((e) => {
      // Streams are good to have, but should not prevent the app from working
      logger.error(e, {
        context: `Failed to stream consent for ${account} no longer retrying`,
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
      captureError(e);
    },
  });
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
    stopStreamingConsent(account);
  }
  delete xmtpClientByAccount[account];
  delete instantiatingClientForAccount[account];
};
