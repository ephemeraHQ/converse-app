import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/PinnedConversations/conversation-list-pinned-conversations.styles";
import Avatar, { AvatarProps } from "@components/Avatar";
import { memo } from "react";

export const PinnedConversationAvatar = memo(function PinnedConversationAvatar(
  props: AvatarProps
) {
  const { avatarSize } = useConversationListPinnedConversationsStyles();
  return <Avatar size={avatarSize} {...props} />;
});
