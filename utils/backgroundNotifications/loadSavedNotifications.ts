import { saveMessages } from "../../data";
import { DispatchType } from "../../data/deprecatedStore/context";
import {
  emptySavedNotificationsMessages,
  loadSavedNotificationsMessages,
} from "../sharedData/sharedData";

let loadingSavedNotifications = false;

const waitForLoadingSavedNotifications = async () => {
  if (!loadingSavedNotifications) return;
  await new Promise((r) => setTimeout(r, 100));
  await waitForLoadingSavedNotifications();
};

export const loadSavedNotificationMessagesToContext = async (
  dispatch?: DispatchType
) => {
  if (loadingSavedNotifications) {
    await waitForLoadingSavedNotifications();
    return;
  }
  loadingSavedNotifications = true;
  try {
    const messages = await loadSavedNotificationsMessages();
    await emptySavedNotificationsMessages();
    messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
    await Promise.all(
      messages.map((message: any) =>
        saveMessages(
          [
            {
              id: message.id,
              senderAddress: message.senderAddress,
              sent: message.sent,
              content: message.content,
              status: "sent",
              sentViaConverse: !!message.sentViaConverse,
              contentType: message.contentType || "xmtp.org/text:1.0",
            },
          ],
          message.topic,
          dispatch
        )
      )
    );

    loadingSavedNotifications = false;
  } catch (e) {
    console.log(
      "An error occured while loading saved notifications messages",
      e
    );
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  }
};
