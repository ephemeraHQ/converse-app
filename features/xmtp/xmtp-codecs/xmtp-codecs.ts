import {
  GroupUpdatedCodec,
  ReactionCodec,
  // ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";

export const supportedXmtpCodecs = [
  new TextCodec(),
  new ReactionCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  // new ReadReceiptCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
];

export type ISupportedXmtpCodecs = typeof supportedXmtpCodecs;
