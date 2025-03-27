import { Text } from "@design-system/Text"
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis"
import React, { memo, useCallback, useMemo } from "react"
import { EntryAnimationsValues, withSpring } from "react-native-reanimated"
import { HStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { StaggeredAnimation } from "@/design-system/staggered-animation"
import { TouchableOpacity } from "@/design-system/TouchableOpacity"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { messageIsFromCurrentSenderInboxId } from "@/features/conversation/utils/message-is-from-current-user"
import { getReactionContent } from "@/features/xmtp/xmtp-codecs/xmtp-codecs-reaction"
import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"
import { IConversationMessageReactionContent } from "../conversation-message.types"
import { useConversationMessageById } from "../use-conversation-message-by-id"
import { MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT } from "./conversation-message-context-menu.constants"

export const MessageContextMenuAboveMessageReactions = memo(
  function MessageContextMenuAboveMessageReactions({
    xmtpConversationId,
    messageId,
    onChooseMoreEmojis,
    onSelectReaction,
    originX,
    originY,
    reactors,
  }: {
    xmtpConversationId: IXmtpConversationId
    messageId: IXmtpMessageId
    onChooseMoreEmojis: () => void
    onSelectReaction: (emoji: string) => void
    originX: number
    originY: number
    reactors: {
      [reactor: IXmtpInboxId]: IConversationMessageReactionContent[]
    }
  }) {
    const { theme } = useAppTheme()

    const currentUserInboxId = useSafeCurrentSender().inboxId

    const { message } = useConversationMessageById({
      messageId,
      xmtpConversationId,
    })

    const messageFromMe =
      message &&
      messageIsFromCurrentSenderInboxId({
        message,
      })

    const currentUserEmojiSelectedMap = useMemo(() => {
      if (!currentUserInboxId || !reactors?.[currentUserInboxId]) {
        return new Map<string, boolean>()
      }

      return new Map(
        reactors[currentUserInboxId].map((reaction) => [getReactionContent(reaction), true]),
      )
    }, [reactors, currentUserInboxId])

    const handlePlusPress = useCallback(() => {
      onChooseMoreEmojis()
    }, [onChooseMoreEmojis])

    const customEnteringAnimation = useCallback(
      (targetValues: EntryAnimationsValues) => {
        "worklet"

        const animations = {
          originX: withSpring(targetValues.targetOriginX, theme.animation.contextMenuSpring),
          originY: withSpring(targetValues.targetOriginY, theme.animation.contextMenuSpring),
          opacity: withSpring(1, theme.animation.contextMenuSpring),
          transform: [{ scale: withSpring(1, theme.animation.contextMenuSpring) }],
        }

        const initialValues = {
          originX:
            originX -
            // For the animation to look good. The real value should be the size of the box / 2 but this is close enough
            theme.layout.screen.width / 2,
          originY,
          opacity: 0,
          transform: [{ scale: 0 }],
        }

        return {
          initialValues,
          animations,
        }
      },
      [theme.animation.contextMenuSpring, originX, originY, theme.layout.screen.width],
    )

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
              paddingHorizontal: theme.spacing.xs,
              backgroundColor: theme.colors.background.raised,
            },
            messageFromMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
          ]}
        >
          {favoritedEmojis.getEmojis().map((emoji, index) => (
            <StaggeredAnimation
              key={emoji}
              index={index}
              totalItems={favoritedEmojis.getEmojis().length}
              isReverse={messageFromMe}
              delayBetweenItems={20}
            >
              <Emoji
                content={emoji}
                alreadySelected={!!currentUserEmojiSelectedMap.get(emoji)}
                onSelectReaction={onSelectReaction}
              />
            </StaggeredAnimation>
          ))}
          <TouchableOpacity hitSlop={theme.spacing.xs} onPress={handlePlusPress}>
            <VStack
              style={{
                height: theme.spacing.xxl,
                width: theme.spacing.xxl,
                borderRadius: theme.spacing.sm,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon icon="plus" size={theme.iconSize.md} color={theme.colors.text.secondary} />
            </VStack>
          </TouchableOpacity>
        </HStack>
      </AnimatedVStack>
    )
  },
)

const Emoji = memo(
  ({
    content,
    alreadySelected,
    onSelectReaction,
  }: {
    content: string
    alreadySelected: boolean
    onSelectReaction: (emoji: string) => void
  }) => {
    const { theme } = useAppTheme()

    const handlePress = useCallback(() => {
      onSelectReaction(content)
    }, [onSelectReaction, content])

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
    )
  },
)
