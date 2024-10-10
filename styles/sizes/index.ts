import { Platform } from "react-native";

export enum AvatarSizes {
  default = 121,

  conversationListItem = Platform.OS === "ios" ? 56 : 47,
  conversationTitle = 30,
  listItemDisplay = 40,
  messageSender = Platform.OS === "ios" ? 30 : 21,
  profileSettings = Platform.OS === "ios" ? 32 : 24,
  pinnedConversation = 80,
  messageReactor = 22,
  reactionsOverlay = 56,
  shareProfile = 56,
  shareProfileCompact = 50,
}

export enum PictoSizes {
  default = 48,

  accoutSettings = 24,
  actionButton = Platform.OS === "android" ? 20 : 11.7,
  button = 13,
  conversationNav = 16,
  newConversationButton = Platform.OS === "ios" ? 16 : 24,
  navItem = 24,
  notification = Platform.OS === "android" ? 80 : 43,
  onboardingComponent = Platform.OS === "android" ? 80 : 43,
  onboarding = 80,
  privyConnect = Platform.OS === "ios" ? 12 : 22,
  replyButton = Platform.OS === "android" ? 16 : 14,
  searchBar = 24,
  sendButton = 34,
  hiddenRequests = Platform.OS === "android" ? 25 : 10,
  swipableItem = Platform.OS === "ios" ? 18 : 30,
  tableViewImage = Platform.OS === "ios" ? 16 : 24,
  textButton = 15,
  cancelAttachmentButton = 6,
  externalWallet = 14,
}

export const BorderRadius = {
  default: 8,
  small: 4,
  large: 14,
  xLarge: 24,
};

export const Paddings = {
  default: 16,
  small: 8,
  large: 24,
};

export const Margins = {
  default: 16,
  small: 8,
  large: 24,
};

// Sizes, spaces, paddings, margins, etc.
export const sizes = {};

// Font sizes
export const fontSizes = {};
