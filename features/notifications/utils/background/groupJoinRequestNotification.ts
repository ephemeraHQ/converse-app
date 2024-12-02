import { ConverseXmtpClientType } from "@/utils/xmtpRN/client";
import { z } from "zod";
import mmkv from "@/utils/mmkv";
import { sentryTrackError, sentryTrackMessage } from "@/utils/sentry";
import notifee, { AndroidVisibility } from "@notifee/react-native";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { putGroupInviteRequest } from "@/utils/api";
import { getGroupByTopic } from "@/utils/xmtpRN/conversations";
import { getTopicFromV3Id } from "@/utils/groupUtils/groupId";
import { ConversationId } from "@xmtp/react-native-sdk";
export const GroupJoinRequestNotificationSchema = z.object({
  type: z.literal("group_join_request"),
  groupId: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  groupInviteId: z.string(),
  joinRequestId: z.string(),
  account: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export type GroupJoinRequestNotification = z.infer<
  typeof GroupJoinRequestNotificationSchema
>;

export const handleGroupJoinRequestNotification = async (
  client: ConverseXmtpClientType,
  notification: GroupJoinRequestNotification
) => {
  const groupId = mmkv.getString(
    `group-invites-link-${notification.groupInviteId}`
  );

  // Don't handle if stored on different device
  if (!groupId) {
    return;
  }

  try {
    const group = await getGroupByTopic({
      client,
      topic: getTopicFromV3Id(groupId as ConversationId),
    });

    if (group) {
      await group.addMembers([notification.address]);
      try {
        await putGroupInviteRequest({
          account: notification.account,
          status: "ACCEPTED",
          joinRequestId: notification.joinRequestId,
        });
      } catch (error) {
        sentryTrackError(error, {
          extras: {
            message: "PUT_GROUP_INVITE_REQUEST_FAILED",
          },
        });
      }

      return; // Don't show notification on success
    }
  } catch (error) {
    sentryTrackError(error, {
      extras: {
        message: "Could not add member to group",
      },
    });
    // Show notification on error
    await notifee.displayNotification({
      title: "New Group Join Request",
      data: notification,
      android: {
        channelId: androidChannel.id,
        pressAction: {
          id: "default",
        },
        visibility: AndroidVisibility.PUBLIC,
      },
    });
    return;
  }

  sentryTrackMessage("No client found for account", {
    extras: {
      account: notification.account,
    },
  });
};
