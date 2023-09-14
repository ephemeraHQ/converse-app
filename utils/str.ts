import { PixelRatio, TextInput } from "react-native";

import { getProfilesStore } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";

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

export type TextInputWithValue = TextInput & { currentValue: string };

export const getReadableProfile = (account: string, address: string) => {
  const primaryENS = getProfilesStore(account)
    .getState()
    .profiles[address]?.socials.ensNames?.find((e) => e.isPrimary)?.name;
  return primaryENS || shortAddress(account);
};
