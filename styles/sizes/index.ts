import { Platform } from "react-native";

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export enum PictoSizes {
  default = 48,
  accoutSettings = 24,
  actionButton = 11.7,
  button = 13,
  conversationNav = 16,
  newConversationButton = 24,
  navItem = 24,
  notification = 43,
  onboardingComponent = 65,
  onboarding = 80,
  privyConnect = 22,
  replyButton = 14,
  searchBar = 24,
  sendButton = 34,
  hiddenRequests = 10,
  swipableItem = 30,
  tableViewImage = 24,
  textButton = 15,
  cancelAttachmentButton = 6,
  externalWallet = 14,
}

/**
 * @deprecated
 */
export const BorderRadius = {
  default: 8,
  small: 4,
  large: 14,
  xLarge: 24,
};

/**
 * @deprecated
 */
export const Paddings = {
  default: 16,
  small: 8,
  large: 24,
};

/**
 * @deprecated
 */
export const Margins = {
  default: 16,
  small: 8,
  large: 24,
};
