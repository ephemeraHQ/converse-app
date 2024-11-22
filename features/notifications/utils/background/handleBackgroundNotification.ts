import notifee, { AndroidVisibility } from "@notifee/react-native";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { z } from "zod";
import { androidChannel } from "../setupAndroidNotificationChannel";
import { getProfilesStore } from "@data/store/accountsStore";
import { getPreferredName, getProfile } from "@utils/profile";
import {
  handleProtocolNotification,
  ProtocolNotification,
  ProtocolNotificationSchema,
} from "./protocolNotification";

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
  const parsedBody = ProtocolNotificationSchema.safeParse(objectBody);

  if (!parsedBody.success) {
    logger.error(`Invalid notification body received: ${parsedBody.error}`);
    return;
  }

  const notification: ProtocolNotification = parsedBody.data;
  handleProtocolNotification(notification);
};
