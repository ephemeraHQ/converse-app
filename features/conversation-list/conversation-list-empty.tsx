import { VStack } from "@/design-system/VStack";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";

export const ConversationListEmpty = memo(function ConversationListEmpty() {
  return <ConversationListSkeletons />;
});

const ConversationListSkeletons = memo(function ConversationListSkeletons() {
  const { theme } = useAppTheme();

  return (
    <VStack>
      {/* 8 to fill up the screen */}
      {new Array(8).fill(null).map((_, index) => (
        <ConversationListItem
          key={index}
          avatarComponent={
            <ConversationListItemAvatarSkeleton
              color={theme.colors.fill.minimal}
              size={theme.avatarSize.lg}
            />
          }
        />
      ))}
    </VStack>
  );
});
