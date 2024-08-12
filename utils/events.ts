import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MediaPreview } from "@data/store/chatStore";
import EventEmitter from "eventemitter3";

import { GroupWithCodecsType } from "./xmtpRN/client";

type ShowActionSheetEvent<T extends string> = `showActionSheetForTxRef-${T}`;
type OpenAttachmentMessage<T extends string> = `openAttachmentForMessage-${T}`;
type AttachmentMessageProcessed<T extends string> =
  `attachmentMessageProcessed-${T}`;

type ConverseEvents = {
  newGroup: (group: GroupWithCodecsType) => void;
  showDebugMenu: () => void;
  "toggle-navigation-drawer": (open: boolean) => void;
  "conversationList-scroll": () => void;
  "enable-transaction-mode": (enabled: boolean) => void;
  openingConversation: (payload: { topic: string }) => void;
  setCurrentConversationMediaPreviewValue: (mediaPreview: MediaPreview) => void;
  highlightMessage: (messageId: string) => void;
  setCurrentConversationInputValue: (value: string) => void;
  triggerReplyToMessage: (message: MessageToDisplay) => void;
  scrollChatToMessage: (value: {
    index?: number;
    messageId?: string;
    animated?: boolean;
  }) => void;
};

type ShowActionSheetEvents = {
  [key in ShowActionSheetEvent<string>]: () => void;
};

type OpenAttachmentMessageEvents = {
  [key in OpenAttachmentMessage<string>]: () => void;
};

type AttachmentMessageProcessedEvents = {
  [key in AttachmentMessageProcessed<string>]: () => void;
};

type Events = ConverseEvents &
  ShowActionSheetEvents &
  OpenAttachmentMessageEvents &
  AttachmentMessageProcessedEvents;

export const converseEventEmitter = new EventEmitter<Events>();
