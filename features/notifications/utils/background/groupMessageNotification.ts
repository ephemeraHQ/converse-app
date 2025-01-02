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

export const isGroupMessageContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/g-");
};

export const handleGroupMessageNotification = async (
  xmtpClient: ConverseXmtpClientType,
  notification: ProtocolNotification
) => {
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
    xmtpClient.inboxId,
    message.senderInboxId,
    senderAddress
  );
  const senderName = getPreferredName(senderSocials, senderAddress);

  const notificationContent = await getNotificationContent(
    conversation as GroupWithCodecsType,
    message
  );
  if (!notificationContent) return;

  if (isGroup) {
    const groupName = await (conversation as Group).groupName();
    const groupImage = await (conversation as Group).groupImageUrlSquare();
    const person: AndroidPerson = {
      name: groupName || "Group",
    };
    if (groupImage) {
      person.icon = groupImage;
    }
    await notifee.displayNotification({
      title: groupName,
      subtitle: senderName,
      body: notificationContent,
      data: notification,
      android: {
        channelId: androidChannel.id,
        pressAction: {
          id: "default",
        },
        visibility: AndroidVisibility.PUBLIC,
        style: {
          type: AndroidStyle.MESSAGING,
          person: {
            name: groupName,
            icon: groupImage,
          },
          messages: [
            {
              // Notifee doesn't handle more complex messages with a group name & image + a person name & image
              // so handling it manually by concatenating sender name & message
              text: `${senderName}: ${notificationContent}`,
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
    await notifee.displayNotification({
      title: senderName,
      body: notificationContent,
      data: notification,
      android: {
        channelId: androidChannel.id,
        pressAction: {
          id: "default",
        },
        visibility: AndroidVisibility.PUBLIC,
        style: {
          type: AndroidStyle.MESSAGING,
          person,
          messages: [
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
};
