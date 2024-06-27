import { Platform } from "react-native";

export enum AvatarSizes {
  default = 121,
  conversationListItem = Platform.OS === "ios" ? 56 : 47,
  messageSender = Platform.OS === "ios" ? 24 : 21,
  conversationTitle = 30,
  profileSettings = Platform.OS === "ios" ? 16 : 24,
  pinnedConversation = 80,
  listItemDisplay = 40,
}

// Sizes, spaces, paddings, margins, etc.
export const sizes = {};

// Font sizes
export const fontSizes = {};
