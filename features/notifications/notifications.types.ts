import * as Notifications from "expo-notifications"
import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "@/features/conversation/conversation.types"

export type IXmtpNewMessageNotification = Omit<Notifications.Notification, "request"> & {
  request: Omit<Notifications.Notification["request"], "trigger"> & {
    trigger: IXmtpNotificationNewMessageTrigger
  }
}

// Not sure why but the data is in trigger
export type IXmtpNotificationNewMessageTrigger = {
  type: "push"
  payload: {
    aps: {
      alert: string
      "mutable-content": 1
    }
    encryptedMessage: string
    topic: IConversationTopic
    messageKind: "v3-conversation"
  }
}

export type IConvosModifiedNotification = Omit<Notifications.Notification, "data"> & {
  data: INotificationMessageDataConverted
}

export type INotificationMessageDataConverted = {
  isProcessedByConvo: boolean
  message: IConversationMessage
}

export type IXmtpNewMessageBackgroundNotificationData = {
  // Not sure why but when i console.log the data, it was in that property
  UIApplicationLaunchOptionsRemoteNotificationKey: {
    messageKind: "v3-conversation"
    topic: string
    encryptedMessage: string
    aps: {
      "mutable-content": 1
      alert: string
    }
  }
}
