import {
  GroupUpdatedCodec,
  MultiRemoteAttachmentCodec,
  ReactionCodec,
  // ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk"

export const supportedXmtpCodecs = [
  new TextCodec(),
  new ReactionCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  // new ReadReceiptCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
  new MultiRemoteAttachmentCodec(),
]

export type ISupportedXmtpCodecs = typeof supportedXmtpCodecs
