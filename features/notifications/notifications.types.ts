import * as Notifications from "expo-notifications"
import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "@/features/conversation/conversation.types"

type INotificationWithData<T> = Omit<Notifications.Notification, "request"> & {
  request: Omit<Notifications.NotificationRequest, "content"> & {
    content: Notifications.NotificationContent & {
      data: T
    }
  }
}

// Type for Expo push notifications containing new messages
export type IExpoNewMessageNotification = INotificationWithData<{
  contentTopic: IConversationTopic
  messageType: "v3-conversation"
  encryptedMessage: string
  timestamp: number
}>

// Type for XMTP push notifications containing new messages
// XMTP places message data in the trigger payload instead of request.content.data
export type IXmtpNewMessageNotification = Omit<Notifications.Notification, "request"> & {
  request: Omit<Notifications.Notification["request"], "trigger"> & {
    trigger: IXmtpNotificationNewMessageTrigger
  }
}

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

// Type for notifications that have been processed by the Convo app
export type IConvosModifiedNotification = Omit<Notifications.Notification, "data"> & {
  data: INotificationMessageDataConverted
}

export type INotificationMessageDataConverted = {
  isProcessedByConvo: boolean
  message: IConversationMessage
}

// Background notification data structure for Expo
export type IExpoBackgroundNotificationData = {
  body: {
    encryptedMessage: string
    messageType: "v3-conversation"
    timestamp: number
    contentTopic: IConversationTopic
  }
  experienceId: string
  projectId: string
  aps: {
    badge: number
    "content-available": 1
  }
  scopeKey: string
}

// Background notification data structure for XMTP
// Data is nested under UIApplicationLaunchOptionsRemoteNotificationKey for iOS
export type IXmtpNewMessageBackgroundNotificationData = {
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
