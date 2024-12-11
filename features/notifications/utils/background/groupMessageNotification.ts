import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { ProtocolNotification } from "./protocolNotification";
import { getProfilesStore } from "@data/store/accountsStore";
import notifee, {
  AndroidStyle,
  AndroidVisibility,
} from "@notifee/react-native";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import { getProfile, getPreferredName } from "@utils/profile";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { getNotificationContent } from "./notificationContent";
import { computeSpamScoreGroupMessage } from "./notificationSpamScore";
import { notificationAlreadyShown } from "./alreadyShown";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { normalizeTimestamp } from "@/utils/date";

export const isGroupMessageContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/g-");
};

export const handleGroupMessageNotification = async (
  xmtpClient: ConverseXmtpClientType,
  notification: ProtocolNotification
) => {
  const groupId = getV3IdFromTopic(
    notification.contentTopic as ConversationTopic
  );
  let group = await xmtpClient.conversations.findGroup(groupId);
  if (!group) {
    await xmtpClient.conversations.sync();
    group = await xmtpClient.conversations.findGroup(groupId);
    if (!group) throw new Error("Group not found");
  }
  await group.sync();
  const groupName = await group.groupName();
  const message = await group.processMessage(notification.message);
  // Not displaying notifications for ourselves, syncing is enough
  if (message.senderAddress === xmtpClient.inboxId) return;
  // Not displaying notifications for already shown messages
  if (notificationAlreadyShown(message.id)) return;
  // Let's compute spam score
  const spamScore = await computeSpamScoreGroupMessage(
    xmtpClient,
    group,
    message
  );
  if (spamScore >= 0) {
    // Not displaying notifications for spam, syncing is enough
    return;
  }
  // For now, use the group member linked address as "senderAddress"
  // @todo => make inboxId a first class citizen
  const senderAddress = (await group.members()).find(
    (m) => m.inboxId === message.senderAddress
  )?.addresses[0];
  if (!senderAddress) return;
  const senderSocials = getProfile(
    senderAddress,
    getProfilesStore(notification.account).getState().profiles
  )?.socials;
  const senderName = getPreferredName(senderSocials, senderAddress);

  const notificationContent = await getNotificationContent(group, message);
  if (!notificationContent) return;

  const groupImage = await group.groupImageUrlSquare();

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
        group: true, // todo => handle 1:1 DM MLS groups
      },
    },
  });
};
