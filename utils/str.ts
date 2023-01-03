import { XmtpConversation } from "../data/store/xmtpReducer";

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
  return conversation.lensHandle || shortAddress(conversation.peerAddress);
};
