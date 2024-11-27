import logger from "@utils/logger";
import {
  handleProtocolNotification,
  ProtocolNotification,
  ProtocolNotificationSchema,
} from "./protocolNotification";
import {
  ConverseNotification,
  ConverseNotificationSchema,
  handleConverseNotification,
} from "./converseNotification";
import { AppState } from "react-native";

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
  const protocolNotificationBody =
    ProtocolNotificationSchema.safeParse(objectBody);

  if (protocolNotificationBody.success) {
    // XMTP protocol notifications are handled by the XMTP SDK if foregrounded
    if (AppState.currentState === "active") return;
    const notification: ProtocolNotification = protocolNotificationBody.data;
    handleProtocolNotification(notification);
    return;
  }

  const converseNotificationBody =
    ConverseNotificationSchema.safeParse(objectBody);
  if (converseNotificationBody.success) {
    const notification: ConverseNotification = converseNotificationBody.data;
    handleConverseNotification(notification);
    return;
  }
};
