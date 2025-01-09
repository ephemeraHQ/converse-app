import logger from "@utils/logger";
import { retryWithBackoff } from "@utils/retryWithBackoff";
import { Client } from "@xmtp/xmtp-js";
import { AppState } from "react-native";
import { getChatStore } from "@data/store/accountsStore";
import {
  buildXmtpClientFromAddress,
  reconnectXmtpClientsDbConnections,
  xmtpClientByAccount,
  xmtpClientByInboxId,
} from "./client";
import { ConverseXmtpClientType } from "./client.types";
import { stopStreamingConversations } from "./conversations";
import { stopStreamingAllMessage, streamAllMessages } from "./messages";
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription";
import { getInboxIdFromCryptocurrencyAddress } from "./signIn";
import {
  fetchPersistedConversationListQuery,
  prefetchConversationListQuery,
} from "@/queries/useConversationListQuery";

const instantiatingClientForAccount: {
  [account: string]: Promise<ConverseXmtpClientType | Client> | undefined;
} = {};

const instantiatingClientForInboxId: {
  [inboxId: string]: Promise<ConverseXmtpClientType | Client> | undefined;
} = {};

export const getOrBuildXmtpClient = async ({
  account,
}: {
  account: string;
}): Promise<ConverseXmtpClientType | Client> => {
  const lowerCaseAccount = account?.toLowerCase();
  if (lowerCaseAccount && xmtpClientByAccount[lowerCaseAccount]) {
    return xmtpClientByAccount[lowerCaseAccount];
  }

  const alreadyInstantiating = instantiatingClientForInboxId[lowerCaseAccount];
  if (alreadyInstantiating) {
    return alreadyInstantiating;
  }
  // Avoid instantiating any 2 clients at the same time to avoid
  // blocking the Expo Async Thread
  if (Object.keys(instantiatingClientForAccount).length > 0) {
    await new Promise((r) => setTimeout(r, 200));
    return getOrBuildXmtpClient({ account });
  }
  // instantiatingClientForAccount[lowerCaseAccount] = (async () => {
  const inboxId = await getInboxIdFromCryptocurrencyAddress({
    address: account,
    cryptocurrency: "ETH",
  });
  instantiatingClientForInboxId[lowerCaseAccount] = (async () => {
    try {
      logger.debug("[XmtpRN] Getting client from address");
      // note(lustig) this function which talks to the sdk requires an ethereum address
      // at the moment. I'm not sure why we cant build the client from the inboxId, but
      // we'll have to learn more here.
      const client = await buildXmtpClientFromAddress(account);
      logger.info(`[XmtpRN] Instantiated client for ${client.address}`);
      getChatStore({ inboxId }).getState().setLocalClientConnected(true);
      getChatStore({ inboxId }).getState().setErrored(false);
      xmtpClientByInboxId[inboxId] = client;
      return client;
    } catch (e: any) {
      getChatStore({ inboxId }).getState().setErrored(true);
      throw e;
    } finally {
      delete instantiatingClientForInboxId[inboxId];
    }
  })();
  return instantiatingClientForInboxId[inboxId] as Promise<
    ConverseXmtpClientType | Client
  >;
};

export const onSyncLost = async ({
  inboxId,
  error,
}: {
  inboxId: string;
  error: any;
}) => {
  // If there is an error let's show it
  getChatStore({ inboxId }).getState().setReconnecting(true);
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
        context: `An error occured while syncing for ${inboxId}`,
      });
    }
  } else {
    logger.error(error, {
      context: `An error occured while syncing for ${inboxId}`,
    });
  }
};

const streamingAccounts: { [account: string]: boolean } = {};
const streamingInboxIds: { [inboxId: string]: boolean } = {};

const syncClientConversationList = async ({ inboxId }: { inboxId: string }) => {
  try {
    // Load the persisted conversation list
    await fetchPersistedConversationListQuery({ inboxId });
    // Streaming conversations
    await retryWithBackoff({
      fn: () => streamConversations({ inboxId }),
      retries: 5,
      delay: 1000,
      factor: 2,
      maxDelay: 30000,
      context: `streaming conversations for ${inboxId}`,
    }).catch((e) => {
      // Streams are good to have, but should not prevent the app from working
      logger.error(e, {
        context: `Failed to stream conversations for ${inboxId} no longer retrying`,
      });
    });
    // Streaming all messages
    await retryWithBackoff({
      fn: () => streamAllMessages({ inboxId }),
      retries: 5,
      delay: 1000,
      factor: 2,
      maxDelay: 30000,
      context: `streaming all messages for ${inboxId}`,
    }).catch((e) => {
      // Streams are good to have, but should not prevent the app from working
      logger.error(e, {
        context: `Failed to stream all messages for ${inboxId} no longer retrying`,
      });
    });
    // Prefetch the conversation list so when we land on the conversation list
    // we have it ready, this will include syncing all groups
    setupAccountTopicSubscription(inboxId);
    await prefetchConversationListQuery({ inboxId });
  } catch (e) {
    logger.error(e, {
      context: `Failed to fetch persisted conversation list for ${inboxId}`,
    });
  }
};

export const syncConversationListXmtpClient = async ({
  inboxId,
}: {
  inboxId: string;
}) => {
  return retryWithBackoff({
    fn: () => syncClientConversationList({ inboxId }),
    retries: 5,
    delay: 1000,
    factor: 2,
    maxDelay: 30000,
    context: `syncing ${inboxId}`,
    onError: async (error) => {
      await onSyncLost({ inboxId, error });
    },
  });
};

export const deleteXmtpClient = async ({
  inboxId,
}: {
  inboxId: string | undefined;
}) => {
  if (!inboxId) {
    logger.error("No inboxId provided to deleteXmtpClient");
    return;
  }
  if (xmtpClientByInboxId[inboxId]) {
    stopStreamingAllMessage({ inboxId });
    stopStreamingConversations({ inboxId });
  }
  delete xmtpClientByInboxId[inboxId];
  delete instantiatingClientForInboxId[inboxId];
  delete streamingInboxIds[inboxId];
};
