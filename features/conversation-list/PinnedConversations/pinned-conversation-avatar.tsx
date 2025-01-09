import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/PinnedConversations/conversation-list-pinned-conversations.styles";
import { Avatar, IAvatarProps } from "@components/Avatar";
import { memo } from "react";

export const PinnedConversationAvatar = memo(function PinnedConversationAvatar(
  props: IAvatarProps
) {
  const { avatarSize } = useConversationListPinnedConversationsStyles();
  return <Avatar size={avatarSize} {...props} />;
});
