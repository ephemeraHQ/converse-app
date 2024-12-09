import {
  ConversationTopic,
  MessageId,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type IConversationStore = {
  topic: ConversationTopic | null;
  peerAddress: string | null;
  uploadedRemoteAttachment: RemoteAttachmentContent | null;
  messageContextMenuData: {
    messageId: MessageId;
    itemRectX: number;
    itemRectY: number;
    itemRectHeight: number;
    itemRectWidth: number;
    messageComponent: React.ReactNode;
  } | null;
  pickingEmojiForMessageId: MessageId | null;
};

export const useConversationStore = create<IConversationStore>()(
  subscribeWithSelector<IConversationStore>(() => ({
    topic: null,
    peerAddress: null,
    uploadedRemoteAttachment: null,
    messageContextMenuData: null,
    pickingEmojiForMessageId: null,
  }))
);
