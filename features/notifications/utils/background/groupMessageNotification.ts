import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { normalizeTimestampToMs } from "@/utils/date";
import logger from "@/utils/logger";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import notifee, {
  AndroidPerson,
  AndroidStyle,
  AndroidVisibility,
} from "@notifee/react-native";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { Conversation, type ConversationTopic } from "@xmtp/react-native-sdk";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { notificationAlreadyShown } from "./alreadyShown";
import { getNotificationContent } from "./notificationContent";
import { computeSpamScoreGroupMessage } from "./notificationSpamScore";
import { ProtocolNotification } from "./protocolNotification";

const getSenderProfileInfo = async (
  xmtpClient: ConverseXmtpClientType,
  conversation: Conversation,
  message: DecodedMessageWithCodecsType
) => {
  // For now, use the group member linked address as "senderAddress"
  // @todo => make inboxId a first class citizen
  const senderAddress = (await conversation.members()).find(
    (m) => m.inboxId === message.senderInboxId
  )?.addresses[0];
  if (!senderAddress)
    return {
      senderName: "",
    };
  const senderSocials = await getInboxProfileSocialsQueryData({
    inboxId: message.senderInboxId,
  });
  // @ts-ignore
  const senderName = getPreferredName(senderSocials, senderAddress);
  // @ts-ignore
  const senderImage = getPreferredAvatar(senderSocials);

  return {
    senderName,
    senderImage,
  };
};

type INotificationFunctionPayloads = {
  notificationContent: string;
  notification: ProtocolNotification;
  conversation: GroupWithCodecsType | DmWithCodecsType;
  message: DecodedMessageWithCodecsType;
  senderName: string;
  senderImage?: string;
};

type IHandleGroupMessageNotification = INotificationFunctionPayloads & {
  conversation: GroupWithCodecsType;
};

const handleGroupMessageNotification = async ({
  notificationContent,
  notification,
  conversation,
  message,
  senderName,
  senderImage,
}: IHandleGroupMessageNotification) => {
  const groupName = await conversation.groupName();
  const groupImage = await conversation.groupImageUrlSquare();
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
      timestamp: normalizeTimestampToMs(message.sentNs),
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
            timestamp: normalizeTimestampToMs(message.sentNs),
          },
        ],
        group: true,
      },
    },
  });
};

type IHandleDmMessageNotification = INotificationFunctionPayloads & {
  conversation: DmWithCodecsType;
};

const handleDmMessageNotification = async ({
  notificationContent,
  notification,
  conversation,
  message,
  senderName,
  senderImage,
}: IHandleDmMessageNotification) => {
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
    conversation?.topic &&
    displayedNotifications.find(
      (n) => n.notification.android?.groupId === conversation?.topic
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
      timestamp: normalizeTimestampToMs(message.sentNs),
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
            timestamp: normalizeTimestampToMs(message.sentNs),
          },
        ],
        group: false,
      },
    },
  });
};

export const handleV3MessageNotification = async (
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

    const notificationContent = await getNotificationContent({
      account: xmtpClient.address,
      message: message as DecodedMessageWithCodecsType,
    });

    if (!notificationContent) return;
    const { senderName, senderImage } = await getSenderProfileInfo(
      xmtpClient,
      conversation,
      message
    );

    if (isConversationGroup(conversation)) {
      handleGroupMessageNotification({
        notificationContent,
        notification,
        conversation,
        message,
        senderName,
        senderImage,
      });
    } else {
      handleDmMessageNotification({
        notificationContent,
        notification,
        conversation,
        message,
        senderName,
        senderImage,
      });
    }
  } catch (e) {
    logger.error(
      `[GroupMessageNotification] Error handling group message notification: ${e}`
    );
  }
};
