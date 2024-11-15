import logger from "@utils/logger";
import {
  emptySavedNotificationsConversations,
  emptySavedNotificationsMessages,
  loadSavedNotificationsConversations,
  loadSavedNotificationsMessages,
} from "@utils/sharedData";
import { saveConversations } from "@data/helpers/conversations/upsertConversations";
import { saveMessages } from "@data/helpers/messages";
import { getAccountsList, getProfilesStore } from "@data/store/accountsStore";
import { XmtpMessage } from "@data/store/chatStore";

let loadingSavedNotifications = false;

const waitForLoadingSavedNotifications = async () => {
  if (!loadingSavedNotifications) return;
  await new Promise((r) => setTimeout(r, 100));
  await waitForLoadingSavedNotifications();
};

export const loadSavedNotificationMessagesToContext = async () => {
  if (loadingSavedNotifications) {
    await waitForLoadingSavedNotifications();
  }
  loadingSavedNotifications = true;
  try {
    const knownAccounts = getAccountsList();
    const conversations = loadSavedNotificationsConversations();
    const messages = loadSavedNotificationsMessages();

    if (conversations && conversations.length > 0) {
      logger.debug(
        `Got ${conversations.length} new conversations from notifications:`,
        conversations
      );
      const conversationsToSaveByAccount: {
        [account: string]: any[];
      } = {};
      conversations.forEach((c: any) => {
        let context = undefined;
        // If conversationId is empty string we require at least some metadata…
        if (
          c.context &&
          (c.context.conversationId ||
            (c.context.metadata && Object.keys(c.context.metadata).length > 0))
        ) {
          context = {
            conversationId: c.context.conversationId,
            metadata: c.context.metadata,
          };
        }
        if (c.account && knownAccounts.includes(c.account)) {
          conversationsToSaveByAccount[c.account] =
            conversationsToSaveByAccount[c.account] || [];
          conversationsToSaveByAccount[c.account].push({
            topic: c.topic,
            peerAddress: c.peerAddress,
            createdAt: c.createdAt,
            readUntil: 0,
            pending: false,
            context,
            spamScore: c.spamScore,
          });
        }
      });
      for (const account in conversationsToSaveByAccount) {
        await saveConversations(
          account,
          conversationsToSaveByAccount[account],
          true
        );
      }
    }

    if (messages && messages.length > 0) {
      messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
      logger.debug(
        `Got ${messages.length} new messages from notifications:`,
        messages
      );
      const messagesToSaveByAccount: {
        [account: string]: XmtpMessage[];
      } = {};
      messages.forEach((message: any) => {
        if (message.account && knownAccounts.includes(message.account)) {
          messagesToSaveByAccount[message.account] =
            messagesToSaveByAccount[message.account] || [];
          messagesToSaveByAccount[message.account].push({
            id: message.id,
            senderAddress: message.senderAddress,
            sent: message.sent,
            content: message.content,
            status: "delivered",
            contentType: message.contentType || "xmtp.org/text:1.0",
            topic: message.topic,
            referencedMessageId: message.referencedMessageId,
          });
        }
      });

      const promises: Promise<void>[] = [];

      for (const account in messagesToSaveByAccount) {
        promises.push(saveMessages(account, messagesToSaveByAccount[account]));
      }
      await Promise.all(promises);
      for (const account in messagesToSaveByAccount) {
        // Refreshing profiles store from mmkv
        // as we could have added data from notification
        getProfilesStore(account).getState().refreshFromStorage();
      }
    }

    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  } catch (e) {
    logger.error(e, {
      error: "An error occured while loading saved notifications",
      errorType: typeof e,
    });

    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  }
};
