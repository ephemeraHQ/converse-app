import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { ProtocolNotification } from "./protocolNotification";
import { getProfilesStore } from "@data/store/accountsStore";
import notifee, { AndroidVisibility } from "@notifee/react-native";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import { getProfile, getPreferredName } from "@utils/profile";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { getNotificationContent } from "./notificationContent";

export const isGroupMessageContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/g-");
};

export const handleGroupMessageNotification = async (
  xmtpClient: ConverseXmtpClientType,
  notification: ProtocolNotification
) => {
  const groupId = getGroupIdFromTopic(notification.contentTopic);
  let group = await xmtpClient.conversations.findGroup(groupId);
  if (!group) {
    await xmtpClient.conversations.syncGroups();
    group = await xmtpClient.conversations.findGroup(groupId);
    if (!group) throw new Error("Group not found");
  }
  await group.sync();
  const groupName = await group.groupName();
  const message = await group.processMessage(notification.message);
  // Not displaying notifications for ourselves, syncing is enough
  if (message.senderAddress === xmtpClient.inboxId) return;
  // For now, use the group member linked address as "senderAddress"
  // @todo => make inboxId a first class citizen
  const senderAddress = (await group.members()).find(
    (m) => m.inboxId === message.senderAddress
  )?.addresses[0];
  const senderSocials = getProfile(
    senderAddress,
    getProfilesStore(notification.account).getState().profiles
  )?.socials;
  const sender = senderAddress
    ? getPreferredName(senderSocials, senderAddress)
    : undefined;

  const messageContent = await getNotificationContent(group, message);
  if (!messageContent) return;

  await notifee.displayNotification({
    title: groupName,
    subtitle: sender,
    body: messageContent,
    data: notification,
    android: {
      channelId: androidChannel.id,
      pressAction: {
        id: "default",
      },
      visibility: AndroidVisibility.PUBLIC,
    },
  });
};
