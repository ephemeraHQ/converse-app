import { ConversationFlatListItem } from "@utils/conversation";
import { ConversationContainerWithCodecsType } from "@utils/xmtpRN/client";

export type FlatListItemType =
  | ConversationFlatListItem
  | ConversationContainerWithCodecsType;
