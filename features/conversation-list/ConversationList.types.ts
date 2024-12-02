import { ConversationFlatListItem } from "@utils/conversation";
import { ConversationWithCodecsType } from "@utils/xmtpRN/client";

export type FlatListItemType =
  | ConversationFlatListItem
  | ConversationWithCodecsType;
