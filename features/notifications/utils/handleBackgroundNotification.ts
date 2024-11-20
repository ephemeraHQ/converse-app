import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { z } from "zod";

const BackgroundNotificationBodySchema = z.object({
  account: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  contentTopic: z.string(),
  message: z.string(),
});

type BackgroundNotificationBody = z.infer<
  typeof BackgroundNotificationBodySchema
>;

export const handleBackgroundNotification = async (
  rawBody: string | undefined
) => {
  let objectBody: unknown = {};
  if (rawBody) {
    try {
      objectBody = JSON.parse(rawBody);
    } catch (e) {
      logger.error(`Failed to parse notification body: ${e}`);
      return;
    }
  }
  const parsedBody = BackgroundNotificationBodySchema.safeParse(objectBody);

  if (!parsedBody.success) {
    logger.error(`Invalid notification body received: ${parsedBody.error}`);
    return;
  }

  const notification: BackgroundNotificationBody = parsedBody.data;
  const xmtpClient = (await getXmtpClient(
    notification.account
  )) as ConverseXmtpClientType;
  const groupId = getGroupIdFromTopic(notification.contentTopic);
  let group = await xmtpClient.conversations.findGroup(groupId);
  if (!group) {
    await xmtpClient.conversations.syncGroups();
    group = await xmtpClient.conversations.findGroup(groupId);
    if (!group) throw new Error("Group not found");
  }
  await group.sync();
  const message = await group.processMessage(notification.message);
  console.log("messages is", { message });
};
