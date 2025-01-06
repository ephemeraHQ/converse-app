import { IConvosContentType } from "@/utils/xmtpRN/content-types/content-types";
import {
  InboxId,
  MessageId,
  NativeMessageContent,
} from "@xmtp/react-native-sdk";

export type IConvosMessageStatus = "sending" | "sent" | "error";

export type IConvosMessageContent = NativeMessageContent & {}; // Add any custom content types content here

export type IConvosMessage = {
  convosMessageId: MessageId;
  xmtpMessageId: MessageId;
  status: IConvosMessageStatus;
  senderInboxId: InboxId;
  sentNs: number;
  type: IConvosContentType;
  content: NativeMessageContent;
};

export type IConvosMessageId = IConvosMessage["convosMessageId"];
