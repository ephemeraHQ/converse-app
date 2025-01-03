import { normalizeTimestamp } from "@/utils/date";
import notifee, {
  AndroidPerson,
  AndroidStyle,
  AndroidVisibility,
} from "@notifee/react-native";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import {
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client.types";
import {
  ConversationVersion,
  Group,
  type ConversationTopic,
} from "@xmtp/react-native-sdk";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { notificationAlreadyShown } from "./alreadyShown";
import { getNotificationContent } from "./notificationContent";
import { computeSpamScoreGroupMessage } from "./notificationSpamScore";
import { ProtocolNotification } from "./protocolNotification";
import logger from "@/utils/logger";

export const isGroupMessageContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/g-");
};

export const handleGroupMessageNotification = async (
  xmtpClient: ConverseXmtpClientType,
  notification: ProtocolNotification
) => {
  try {
    let conversation = await xmtpClient.conversations.findConversationByTopic(
      notification.contentTopic as ConversationTopic
    );
    if (!conversation) {
      await xmtpClient.conversations.sync();
      conversation = await xmtpClient.conversations.findConversationByTopic(
        notification.contentTopic as ConversationTopic
      );
      if (!conversation) throw new Error("Conversation not found");
    }
    await conversation.sync();
    const isGroup = conversation.version === ConversationVersion.GROUP;

    const message = await conversation.processMessage(notification.message);
    // Not displaying notifications for ourselves, syncing is enough
    if (message.senderInboxId === xmtpClient.inboxId) return;
    // Not displaying notifications for already shown messages
    if (notificationAlreadyShown(message.id)) return;
    // Let's compute spam score
    const spamScore = await computeSpamScoreGroupMessage(
      xmtpClient,
      conversation as GroupWithCodecsType,
      message
    );
    if (spamScore >= 0) return;
    // For now, use the group member linked address as "senderAddress"
    // @todo => make inboxId a first class citizen
    const senderAddress = (await conversation.members()).find(
      (m) => m.inboxId === message.senderInboxId
    )?.addresses[0];
    if (!senderAddress) return;
    const senderSocials = await getProfile(
      xmtpClient.address,
      message.senderInboxId,
      senderAddress
    );
    const senderName = getPreferredName(senderSocials, senderAddress);
    const senderImage = getPreferredAvatar(senderSocials);

    const notificationContent = await getNotificationContent(
      conversation as GroupWithCodecsType,
      message
    );
    if (!notificationContent) return;

    if (isGroup) {
      const groupName = await (conversation as Group).groupName();
      const groupImage = await (conversation as Group).groupImageUrlSquare();
      const person: AndroidPerson = {
        name: senderName,
      };
      if (senderImage) {
        person.icon = senderImage;
      }

      const withLargeIcon = groupImage
        ? {
            largeIcon: groupImage,
            circularLargeIcon: true,
          }
        : {};
      const displayedNotifications = await notifee.getDisplayedNotifications();
      const previousGroupIdNotification =
        conversation.topic &&
        displayedNotifications.find(
          (n) => n.notification.android?.groupId === conversation.topic
        );
      const previousMessages =
        previousGroupIdNotification?.notification.android?.style?.type ===
        AndroidStyle.MESSAGING
          ? previousGroupIdNotification.notification.android?.style?.messages
          : [];
      if (previousGroupIdNotification?.notification.id) {
        notifee.cancelDisplayedNotification(
          previousGroupIdNotification.notification.id
        );
      }
      await notifee.displayNotification({
        title: groupName,
        subtitle: senderName,
        body: notificationContent,
        data: notification,
        android: {
          channelId: androidChannel.id,
          groupId: conversation.topic,
          timestamp: normalizeTimestamp(message.sentNs),
          showTimestamp: true,
          pressAction: {
            id: "default",
          },
          visibility: AndroidVisibility.PUBLIC,
          ...withLargeIcon,
          style: {
            type: AndroidStyle.MESSAGING,
            person: person,
            messages: [
              ...previousMessages,
              {
                text: notificationContent,
                timestamp: normalizeTimestamp(message.sentNs),
              },
            ],
            group: true,
          },
        },
      });
    } else {
      const senderImage = getPreferredAvatar(senderSocials);
      const person: AndroidPerson = {
        name: senderName,
      };
      if (senderImage) {
        person.icon = senderImage;
      }
      const withLargeIcon = senderImage
        ? {
            largeIcon: senderImage,
            circularLargeIcon: true,
          }
        : {};
      const displayedNotifications = await notifee.getDisplayedNotifications();
      const previousGroupIdNotification =
        conversation.topic &&
        displayedNotifications.find(
          (n) => n.notification.android?.groupId === conversation.topic
        );
      const previousMessages =
        previousGroupIdNotification?.notification.android?.style?.type ===
        AndroidStyle.MESSAGING
          ? previousGroupIdNotification.notification.android?.style?.messages
          : [];
      if (previousGroupIdNotification?.notification.id) {
        notifee.cancelDisplayedNotification(
          previousGroupIdNotification.notification.id
        );
      }
      await notifee.displayNotification({
        title: senderName,
        body: notificationContent,
        data: notification,
        android: {
          channelId: androidChannel.id,
          groupId: conversation.topic,
          timestamp: normalizeTimestamp(message.sentNs),
          showTimestamp: true,
          pressAction: {
            id: "default",
          },
          visibility: AndroidVisibility.PUBLIC,
          ...withLargeIcon,
          style: {
            type: AndroidStyle.MESSAGING,
            person,
            messages: [
              ...previousMessages,
              {
                text: notificationContent,
                timestamp: normalizeTimestamp(message.sentNs),
              },
            ],
            group: false,
          },
        },
      });
    }
  } catch (e) {
    logger.error(
      `[GroupMessageNotification] Error handling group message notification: ${e}`
    );
  }
};
