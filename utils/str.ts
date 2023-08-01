import { PixelRatio } from "react-native";

import { XmtpConversation } from "../data/deprecatedStore/xmtpReducer";

export const shortAddress = (address: string) =>
  address && address.length > 7
    ? `${address.slice(0, 4)}...${address.slice(
        address.length - 4,
        address.length
      )}`
    : address || "";

export const addressPrefix = (address: string) =>
  (address && address.length >= 6 ? address.slice(0, 6) : address) || "";

export const conversationName = (conversation: XmtpConversation) => {
  return (
    conversation.conversationTitle || shortAddress(conversation.peerAddress)
  );
};

export const getTitleFontScale = (): number => {
  let titleFontScale = 1;
  const fontScale = PixelRatio.getFontScale();
  if (fontScale > 1) {
    titleFontScale = Math.min(fontScale, 1.235);
  }
  return titleFontScale;
};
