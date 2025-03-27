import { Text } from "@design-system/Text"
import React, { FC, memo, useMemo } from "react"
import { FlatList } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { GroupAvatarInboxIds } from "@/components/group-avatar"
import { AnimatedCenter, Center } from "@/design-system/Center"
import { HStack } from "@/design-system/HStack"
import { getReactionContent } from "@/features/xmtp/xmtp-codecs/xmtp-codecs-reaction"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"
import { ObjectTyped } from "@/utils/object-typed"
import { IConversationMessageReactionContent } from "../conversation-message.types"

type MessageContextMenuReactorsProps = {
  reactors: {
    [reactor: IXmtpInboxId]: IConversationMessageReactionContent[]
  }
}

export const MessageContextMenuReactors: FC<MessageContextMenuReactorsProps> = ({ reactors }) => {
  const { theme } = useAppTheme()

  const safeAreaInsets = useSafeAreaInsets()

  const listData = useMemo(() => {
    if (!reactors) {
      return []
    }

    const reactionMap: Record<string, IXmtpInboxId[]> = {}
    ObjectTyped.entries(reactors).forEach(([reactorInboxId, reactions]) => {
      if (!reactions || reactions.length === 0) {
        return
      }
      for (const reaction of reactions) {
        if (!reactionMap[getReactionContent(reaction)]) {
          reactionMap[getReactionContent(reaction)] = []
        }
        reactionMap[getReactionContent(reaction)].push(reactorInboxId as IXmtpInboxId)
      }
    })
    return Object.entries(reactionMap)
  }, [reactors])

  return (
    <AnimatedCenter
      vertical
      entering={theme.animation.reanimatedFadeInScaleIn()}
      style={{
        position: "absolute",
        top: safeAreaInsets.top + theme.spacing.xs,
        left: 0,
        right: 0,
      }}
    >
      <FlatList
        data={listData}
        horizontal
        contentContainerStyle={{
          borderRadius: theme.spacing.lg,
          backgroundColor: theme.colors.background.raised,
          padding: theme.spacing.sm,
          columnGap: theme.spacing.sm,
        }}
        renderItem={({ item: [content, inboxIds], index }) => (
          <Item content={content} inboxIds={inboxIds} />
        )}
        keyExtractor={(item) => item[0]}
        showsHorizontalScrollIndicator={false}
      />
    </AnimatedCenter>
  )
}

type MessageReactionsItemProps = {
  content: string
  inboxIds: IXmtpInboxId[]
}

const Item = memo(function Item({ content, inboxIds }: MessageReactionsItemProps) {
  const { theme } = useAppTheme()

  return (
    <Center
      vertical
      style={{
        rowGap: theme.spacing.xxs,
      }}
    >
      <GroupAvatarInboxIds inboxIds={inboxIds} />
      <HStack
        style={{
          alignItems: "center",
          columnGap: theme.spacing.xxxs,
        }}
      >
        <Text>{content}</Text>
        <Text color="secondary" preset="small">
          {inboxIds.length}
        </Text>
      </HStack>
    </Center>
  )
})
