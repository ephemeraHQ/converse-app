import {
  useConversationMessageById,
  useCurrentAccountInboxId,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { HStack } from "@/design-system/HStack";
import { Icon } from "@/design-system/Icon/Icon";
import { TouchableOpacity } from "@/design-system/TouchableOpacity";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { messageIsFromCurrentUserV3 } from "@/features/conversation/utils/messageIsFromCurrentUser";
import { getReactionContent } from "@/utils/xmtpRN/reactions";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis";
import { InboxId, MessageId, ReactionContent } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useMemo } from "react";
import {
  EntryAnimationsValues,
  FadeIn,
  withSpring,
} from "react-native-reanimated";
import { MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT } from "./conversation-message-context-menu-constant";

export const MessageContextMenuAboveMessageReactions = memo(
  function MessageContextMenuAboveMessageReactions({
    messageId,
    onChooseMoreEmojis,
    onSelectReaction,
    originX,
    originY,
    reactors,
  }: {
    messageId: MessageId;
    onChooseMoreEmojis: () => void;
    onSelectReaction: (emoji: string) => void;
    originX: number;
    originY: number;
    reactors: {
      [reactor: InboxId]: ReactionContent[];
    };
  }) {
    const { theme } = useAppTheme();

    const { data: currentUserInboxId } = useCurrentAccountInboxId();

    const { message } = useConversationMessageById(messageId);

    const messageFromMe = messageIsFromCurrentUserV3({
      message,
    });

    const currentUserEmojiSelectedMap = useMemo(() => {
      if (!currentUserInboxId || !reactors?.[currentUserInboxId]) {
        return new Map<string, boolean>();
      }

      return new Map(
        reactors[currentUserInboxId].map((reaction) => [
          getReactionContent(reaction),
          true,
        ])
      );
    }, [reactors, currentUserInboxId]);

    const handlePlusPress = useCallback(() => {
      onChooseMoreEmojis();
    }, [onChooseMoreEmojis]);

    const customEnteringAnimation = useCallback(
      (targetValues: EntryAnimationsValues) => {
        "worklet";

        const animations = {
          originX: withSpring(
            targetValues.targetOriginX,
            theme.animation.contextMenuSpring
          ),
          originY: withSpring(
            targetValues.targetOriginY,
            theme.animation.contextMenuSpring
          ),
          opacity: withSpring(1, theme.animation.contextMenuSpring),
          transform: [
            { scale: withSpring(1, theme.animation.contextMenuSpring) },
          ],
        };

        const initialValues = {
          originX:
            originX -
            // For the animation to look good. The real value should be the size of the box / 2 but this is close enough
            theme.layout.screen.width / 2,
          originY,
          opacity: 0,
          transform: [{ scale: 0 }],
        };

        return {
          initialValues,
          animations,
        };
      },
      [
        theme.animation.contextMenuSpring,
        originX,
        originY,
        theme.layout.screen.width,
      ]
    );

    return (
      <AnimatedVStack
        entering={customEnteringAnimation}
        style={{
          flex: 1,
        }}
      >
        <HStack
          style={[
            {
              height: MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT,
              justifyContent: "space-around",
              alignItems: "center",
              borderRadius: theme.spacing.lg,
              paddingHorizontal: theme.spacing.xxs,
              backgroundColor: theme.colors.background.raised,
            },
            messageFromMe
              ? { alignSelf: "flex-end" }
              : { alignSelf: "flex-start" },
          ]}
        >
          {favoritedEmojis.getEmojis().map((emoji, index) => (
            <AnimatedVStack
              key={emoji}
              // TODO, build a better animation using staggered animations. Build it in a design system component so it's easier to reuse
              entering={FadeIn.delay(
                (favoritedEmojis.getEmojis().length - index) * 60 + 100
              )}
            >
              <Emoji
                content={emoji}
                alreadySelected={!!currentUserEmojiSelectedMap.get(emoji)}
                onSelectReaction={onSelectReaction}
              />
            </AnimatedVStack>
          ))}
          <TouchableOpacity
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
            onPress={handlePlusPress}
          >
            <VStack
              style={{
                height: theme.spacing.xxl,
                width: theme.spacing.xxl,
                borderRadius: theme.spacing.sm,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon
                icon="plus"
                size={theme.iconSize.md}
                color={theme.colors.text.secondary}
              />
            </VStack>
          </TouchableOpacity>
        </HStack>
      </AnimatedVStack>
    );
  }
);

const Emoji = memo(
  ({
    content,
    alreadySelected,
    onSelectReaction,
  }: {
    content: string;
    alreadySelected: boolean;
    onSelectReaction: (emoji: string) => void;
  }) => {
    const { theme } = useAppTheme();

    const handlePress = useCallback(() => {
      onSelectReaction(content);
    }, [onSelectReaction, content]);

    return (
      <TouchableOpacity
        hitSlop={{
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        }}
        onPress={handlePress}
      >
        <VStack
          style={[
            {
              height: theme.spacing.xxl,
              width: theme.spacing.xxl,
              justifyContent: "center",
              alignItems: "center",
              marginRight: theme.spacing["4xs"],
            },
            alreadySelected && {
              backgroundColor: theme.colors.fill.minimal,
              borderRadius: theme.spacing.sm,
            },
          ]}
        >
          <Text preset="emojiSymbol">{content}</Text>
        </VStack>
      </TouchableOpacity>
    );
  }
);
