import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { sentryTrackError } from "@utils/sentry";

export const getGroup = async (
  xmtpClient: ConverseXmtpClientType,
  groupId: string
) => {
  try {
    await xmtpClient.conversations.syncGroups();
    const group = await xmtpClient.conversations.findGroup(groupId);
    if (group) {
      await group.sync();
      return group;
    }
  } catch (error) {
    sentryTrackError(error, {
      extras: {
        message: "Could not get or sync group",
      },
    });
  }
  return null;
};
