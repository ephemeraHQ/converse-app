import { memo } from "react";
import { Avatar, IAvatarProps } from "@/components/avatar";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";

export const PinnedConversationAvatar = memo(function PinnedConversationAvatar(
  props: IAvatarProps,
) {
  const { avatarSize } = useConversationListPinnedConversationsStyles();
  return <Avatar size={avatarSize} {...props} />;
});
