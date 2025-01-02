import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { ProtocolNotification } from "./protocolNotification";
import { computeSpamScoreGroupWelcome } from "./notificationSpamScore";
import notifee, {
  AndroidStyle,
  AndroidVisibility,
} from "@notifee/react-native";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { notificationAlreadyShown } from "./alreadyShown";

export const isGroupWelcomeContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/w-");
};

const getNewGroup = async (xmtpClient: ConverseXmtpClientType) => {
  // Welcome envelopes are too large to send in a push, so sync to get latest group
  await xmtpClient.conversations.sync();
  const groups = await xmtpClient.conversations.listGroups();
  if (groups.length === 0) return;
  const mostRecentGroup = groups.reduce((latest, current) => {
    if (!latest || current.createdAt > latest.createdAt) {
      return current;
    }
    return latest;
  }, groups[0]);
  await mostRecentGroup.sync();
  return mostRecentGroup;
};

export const handleGroupWelcomeNotification = async (
  xmtpClient: ConverseXmtpClientType,
  notification: ProtocolNotification
) => {
  const group = await getNewGroup(xmtpClient);
  // Not displaying notifications for already shown messages
  if (!group) return;
  if (notificationAlreadyShown(`welcome-${group.id}`)) return;
  const spamScore = await computeSpamScoreGroupWelcome(xmtpClient, group);
  if (spamScore >= 0) return;
  const groupState = await group.consentState();
  const groupAllowed = groupState === "allowed";
  const groupDenied = groupState === "denied";

  // If group is already consented (either way) then don't show a notification
  // for welcome as this will likely be a second+ installation
  if (groupAllowed || groupDenied) return;
  const groupName = await group.groupName();
  const groupImage = await group.groupImageUrlSquare();

  await notifee.displayNotification({
    title: groupName,
    body: "You have been added to a new group",
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
            text: "You have been added to a new group",
            timestamp: Date.now(),
          },
        ],
        group: true, // todo => handle 1:1 DM MLS groups
      },
    },
  });
};
