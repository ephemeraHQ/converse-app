import { FirebaseMessagingTypes } from "@react-native-firebase/messaging/lib";
import { DecodedMessage } from "@xmtp/xmtp-js";
import {
  ConversationV2 as ConversationV2Type,
  ConversationV1 as ConversationV1Type,
} from "@xmtp/xmtp-js/dist/types/src/conversations";
import * as Notifications from "expo-notifications";

import { loadXmtpConversation, loadXmtpKeys } from "../keychain";
import { getXmtpClientFromKeys } from "../xmtp";

const {
  ConversationV1,
  ConversationV2,
} = require("@xmtp/xmtp-js/dist/esm/src/conversations/Conversation");

export const handleAndroidBackgroundNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  try {
    const keys = await loadXmtpKeys();
    if (!keys) return;
    const parsedKeys = JSON.parse(keys);
    const client = await getXmtpClientFromKeys(parsedKeys);
    const bodyString = remoteMessage.data?.body;
    let data: { [key: string]: any } = {};
    if (bodyString) {
      try {
        data = JSON.parse(bodyString);
      } catch (e: any) {
        console.log(e);
      }
    }
    if (data.contentTopic) {
      const savedConversation = await loadXmtpConversation(data.contentTopic);
      if (!savedConversation) return;
      let parsedConversation: any = {};
      try {
        parsedConversation = JSON.parse(savedConversation);
      } catch (e) {
        console.log(e);
      }
      if (!parsedConversation) return;
      if (parsedConversation.version === "v1") {
        const conversationV1: ConversationV1Type = ConversationV1.fromExport(
          client,
          parsedConversation
        );
        if (!conversationV1) return;
        const decodedMessage: DecodedMessage =
          await conversationV1.decodeMessage(data);
        Notifications.scheduleNotificationAsync({
          content: {
            title: conversationV1.peerAddress,
            body: decodedMessage.content,
          },
          trigger: null,
        });
      } else if (parsedConversation.version === "v2") {
        const conversationV2: ConversationV2Type = ConversationV2.fromExport(
          client,
          parsedConversation
        );
        if (!conversationV2) return;
        const decodedMessage: DecodedMessage =
          await conversationV2.decodeMessage(data);
        Notifications.scheduleNotificationAsync({
          content: {
            title: conversationV2.peerAddress,
            body: decodedMessage.content,
            data,
          },
          trigger: null,
        });
        Notifications.setBadgeCountAsync(0);
      }
    }
  } catch (e) {
    console.log("An error occured while decoding the incoming notification");
    console.log(e);
  }
};
