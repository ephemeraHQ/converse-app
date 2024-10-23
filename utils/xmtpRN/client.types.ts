import { EntityObject } from "@queries/entify";
import { getXmtpClientFromBase64Key } from "@utils/xmtpRN/client";
import { Group } from "@xmtp/react-native-sdk";

export type ConverseXmtpClientType = Awaited<
  ReturnType<typeof getXmtpClientFromBase64Key>
>;

export type ConversationWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newConversation"]>
>;

// while this gets us auto complete, it's very cumbersome to jump into the
// actual definition, hence any group below. cmd+click jumps right to
// the sdk definition
export type GroupWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newGroup"]>
>;

// It's a little strange that there is no group type without behavior
// the behavior is driven by the generic codecs but are unused
// simply for data purposes,
export type AnyGroup = Group<any[]>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export type XmtpClientByAccount = {
  [account: string]: ConverseXmtpClientType;
};

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

export type GroupsDataEntity = EntityObject<GroupData>;

export type GroupsEntity = EntityObject<AnyGroup>;
