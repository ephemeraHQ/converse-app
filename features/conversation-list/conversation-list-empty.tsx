import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { LinearGradient } from "@/design-system/linear-gradient";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { useAppTheme } from "@/theme/useAppTheme";
import { hexToRGBA } from "@/utils/colors";
import React, { memo } from "react";

export const ConversationListEmpty = memo(function ConversationListEmpty() {
  const { pinnedConversations = [] } = usePinnedConversations();

  const { theme } = useAppTheme();

  const { listItemPaddingVertical } = useConversationListStyles();

  // If there are pinned conversations, don't show the empty state
  if (pinnedConversations?.length > 0) {
    return null;
  }

  return (
    <VStack style={{ flex: 1 }}>
      <LinearGradient
        colors={[
          hexToRGBA(theme.colors.background.surface, 0),
          hexToRGBA(theme.colors.background.surface, 1),
        ]}
        locations={[0, 0.3]} // 0.3 is trial and error until it looks good
        style={{
          position: "absolute",
          top: (theme.avatarSize.lg + listItemPaddingVertical) * 2, // We want to show 2 full rows before starting the gradient
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />
      <AnimatedVStack entering={theme.animation.reanimatedFadeInSpring}>
        {/* 6 to fill up the screen */}
        {new Array(6).fill(null).map((_, index) => (
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
      </AnimatedVStack>
    </VStack>
  );
});
