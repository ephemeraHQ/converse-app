import { FirebaseMessagingTypes } from "@react-native-firebase/messaging/lib";
import { Client, DecodedMessage } from "@xmtp/xmtp-js";
import {
  buildUserInviteTopic,
  buildUserIntroTopic,
  //@ts-ignore
} from "@xmtp/xmtp-js/dist/cjs/src/utils";
import { SealedInvitation as SealedInvitationType } from "@xmtp/xmtp-js/dist/types/src/Invitation";
import {
  ConversationV2 as ConversationV2Type,
  ConversationV1 as ConversationV1Type,
} from "@xmtp/xmtp-js/dist/types/src/conversations";
import * as Notifications from "expo-notifications";

import {
  loadXmtpConversation,
  loadXmtpKeys,
  saveXmtpConversations,
} from "../keychain";
import { subscribeToNewTopic } from "../notifications";
import {
  loadConversationDict,
  saveNewNotificationMessage,
} from "../sharedData/sharedData.android";
import { shortAddress } from "../str";
import { getXmtpClientFromKeys } from "../xmtp";

const { SealedInvitation } = require("@xmtp/xmtp-js/dist/esm/src/Invitation");
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
    const introTopic = buildUserIntroTopic(client.address);
    const inviteTopic = buildUserInviteTopic(client.address);
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
      if (data.contentTopic === introTopic) {
        // We don't show notifications for new ConversationV1
        return;
      } else if (data.contentTopic === inviteTopic) {
        // Show notification for new ConversationV2
        await handleBackgroundNotificationForNewConversationV2(data, client);
      } else {
        await handleBackgroundNotificationForNewMessage(data, client);
      }
    }
  } catch (e) {
    console.log("An error occured while decoding the incoming notification");
    console.log(e);
  }
};

const handleBackgroundNotificationForNewConversationV2 = async (
  data: { [key: string]: any },
  client: Client
) => {
  const sealed: SealedInvitationType = await SealedInvitation.fromEnvelope(
    data
  );
  const unsealed = await sealed.v1.getInvitation(client.keys);
  const conversationV2: ConversationV2Type = await ConversationV2.create(
    client,
    unsealed,
    sealed.v1.header
  );
  subscribeToNewTopic(conversationV2.topic);
  Notifications.scheduleNotificationAsync({
    content: {
      title: shortAddress(conversationV2.peerAddress),
      body: "New conversation",
      data,
    },
    trigger: null,
  });
  const conversationToSave = JSON.stringify([conversationV2.export()]);
  saveXmtpConversations(client.address, conversationToSave);
};

const handleBackgroundNotificationForNewMessage = async (
  data: { [key: string]: any },
  client: Client
) => {
  const savedConversation = await loadXmtpConversation(data.contentTopic);
  if (!savedConversation) {
    return;
  }
  const conversationDict = await loadConversationDict(data.contentTopic);
  const savedFrom = conversationDict?.lensHandle || conversationDict?.ensName;
  let parsedConversation: any = {};
  try {
    parsedConversation = JSON.parse(savedConversation);
  } catch (e) {
    console.log(e);
  }
  if (!parsedConversation) return;
  let peerAddress = "";
  let decodedMessage: DecodedMessage | null = null;
  if (parsedConversation.version === "v1") {
    const conversationV1: ConversationV1Type = ConversationV1.fromExport(
      client,
      parsedConversation
    );
    if (!conversationV1) return;
    decodedMessage = await conversationV1.decodeMessage(data);
    peerAddress = conversationV1.peerAddress;
  } else if (parsedConversation.version === "v2") {
    const conversationV2: ConversationV2Type = ConversationV2.fromExport(
      client,
      parsedConversation
    );
    if (!conversationV2) return;
    decodedMessage = await conversationV2.decodeMessage(data);
    peerAddress = conversationV2.peerAddress;
  }
  if (!decodedMessage) return;
  if (decodedMessage.senderAddress !== client.address) {
    // Let's show a notification if not from me
    Notifications.scheduleNotificationAsync({
      content: {
        title: savedFrom || shortAddress(peerAddress),
        body: decodedMessage.content,
        data,
      },
      trigger: null,
    });
  }
  // Let's save the message to be able to show it
  // immediatly when user reopens the app
  saveNewNotificationMessage(data.contentTopic, decodedMessage);
};
