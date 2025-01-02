import { EntityObject } from "@queries/entify";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  Client,
  Conversation,
  Dm,
  Group,
  GroupUpdatedCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import {
  CoinbaseMessagingPaymentCodec, // the behavior is driven by the generic codecs but are unused
} from "./content-types/coinbasePayment";

export type SupportedCodecsType = [
  TextCodec,
  ReactionCodec,
  ReadReceiptCodec,
  GroupUpdatedCodec,
  ReplyCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
  TransactionReferenceCodec,
  CoinbaseMessagingPaymentCodec,
];

export type ConverseXmtpClientType = Client<SupportedCodecsType>;

export type ConversationWithCodecsType = Conversation<SupportedCodecsType>;

export type DmWithCodecsType = Dm<SupportedCodecsType>;

export type GroupWithCodecsType = Group<SupportedCodecsType>;

// It's a little strange that there is no group type without behavior
// the behavior is driven by the generic codecs but are unused
// simply for data purposes,
export type AnyGroup = Group<any[]>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export type SendMessageWithCodecs = Parameters<
  ConversationWithCodecsType["send"]
>;

export type GroupData = Pick<
  AnyGroup,
  | "id"
  | "createdAt"
  | "members"
  | "topic"
  | "creatorInboxId"
  | "name"
  | "isGroupActive"
  | "addedByInboxId"
  | "imageUrlSquare"
  | "description"
  | "state"
>;

// export type ConversationData = Pick<
//   ConversationWithCodecsType,
//   "conversationVersion"
//   // | "createdAt"
//   // | "members"
//   // | "topic"
//   // | "addedByInboxId"
//   // | "imageUrlSquare"
//   // | "description"
//   // | "state"
// >;

export type GroupsDataEntity = EntityObject<GroupData>;

export type ConversationDataEntity = EntityObject<
  // todo(lustig) fix this type so that it is serializable and plays nicely with xstate inspection
  // when omitting client, typescript complains in JoinGroup.client.ts
  // Omit<ConversationWithCodecsType, "client">,
  ConversationWithCodecsType,
  string
>;

export type GroupsEntity = EntityObject<AnyGroup>;
