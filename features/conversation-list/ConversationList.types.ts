import { ConversationFlatListItem } from "@utils/conversation";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";

export type FlatListItemType =
  | ConversationFlatListItem
  | ConversationWithCodecsType;
