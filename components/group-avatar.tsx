import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import React, { memo, useMemo } from "react"
import { StyleProp, TextStyle, ViewStyle } from "react-native"
import { Center } from "@/design-system/Center"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { useGroupQuery } from "@/features/groups/queries/group.query"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { Nullable } from "@/types/general"
import { IEthereumAddress } from "@/utils/evm/address"
import { Avatar } from "./avatar"

// Constants
const MAIN_CIRCLE_RADIUS = 50
const MAX_VISIBLE_MEMBERS = 4

// Types
type Position = {
  x: number
  y: number
  size: number
}

type GroupAvatarMember = {
  address: Nullable<IEthereumAddress>
  uri: Nullable<string>
  name: Nullable<string>
}

type GroupAvatarUIProps = {
  size?: number
  style?: StyleProp<ViewStyle>
  members?: GroupAvatarMember[]
}

type IGroupAvatarSize = "sm" | "md" | "lg" | "xl" | "xxl"

type ExtraMembersIndicatorProps = {
  pos: Position
  extraMembersCount: number
  size: number
}

/**
 * Component to render a group avatar from a list of inbox IDs
 */
export const GroupAvatarInboxIds = memo(function GroupAvatarInboxIds(props: {
  inboxIds: IXmtpInboxId[]
}) {
  const { inboxIds } = props

  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: inboxIds,
  })

  const members = useMemo(() => {
    return preferredDisplayData
      ?.map((info) => {
        if (!info) {
          return null
        }

        return {
          address: info.ethAddress,
          uri: info.avatarUrl,
          name: info.displayName,
        }
      })
      .filter(Boolean)
  }, [preferredDisplayData])

  return <GroupAvatarUI members={members} />
})

/**
 * Component to render a group avatar from a group topic
 * Will render the group image if available, otherwise shows member avatars
 */
export const GroupAvatar = memo(function GroupAvatar(props: {
  xmtpConversationId: IXmtpConversationId
  size?: IGroupAvatarSize
  sizeNumber?: number
}) {
  const { xmtpConversationId, size = "md", sizeNumber: sizeNumberProp } = props
  const { theme } = useAppTheme()
  const currentSender = useSafeCurrentSender()

  // Fetch group data
  const { data: group } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  // Extract member inbox IDs excluding current sender
  const memberInboxIds = useMemo(() => {
    if (!group?.members?.ids) {
      return []
    }

    return group.members.ids.reduce<IXmtpInboxId[]>((inboxIds, memberId) => {
      const memberInboxId = group.members.byId[memberId].inboxId

      if (memberInboxId) {
        inboxIds.push(memberInboxId)
      }

      return inboxIds
    }, [])
  }, [group])

  // Get display info for all members
  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: memberInboxIds,
  })

  // Transform display data into member format
  const memberData = useMemo<GroupAvatarMember[]>(() => {
    if (!preferredDisplayData) {
      return []
    }

    return preferredDisplayData
      .map((profile): GroupAvatarMember | null => {
        if (!profile) {
          return null
        }

        return {
          address: profile.ethAddress,
          uri: profile.avatarUrl,
          name: profile.displayName,
        }
      })
      .filter(Boolean)
  }, [preferredDisplayData])

  // Calculate size based on theme or prop
  const sizeNumber = useMemo(() => {
    if (sizeNumberProp) {
      return sizeNumberProp
    }

    switch (size) {
      case "sm":
        return theme.avatarSize.sm
      case "md":
        return theme.avatarSize.md
      case "lg":
        return theme.avatarSize.lg
      case "xl":
        return theme.avatarSize.xl
      case "xxl":
        return theme.avatarSize.xxl
      default:
        const _ensureNever: never = size
        throw new Error("Invalid group avatar size")
    }
  }, [size, theme, sizeNumberProp])

  // If group has an image, use it instead of member avatars
  if (group?.imageUrl) {
    return <Avatar uri={group.imageUrl} sizeNumber={sizeNumber} name={group.name} />
  }

  return <GroupAvatarUI members={memberData} size={sizeNumber} />
})

/**
 * Core UI component for group avatars
 * Handles positioning of member avatars in a circular layout
 */
const GroupAvatarUI = memo(function GroupAvatarUI(props: GroupAvatarUIProps) {
  const { themed, theme } = useAppTheme()
  const { size = theme.avatarSize.md, style, members = [] } = props
  const memberCount = members.length

  // Calculate positions for avatars based on member count
  const positions = useMemo(
    () => calculatePositions(memberCount, MAIN_CIRCLE_RADIUS),
    [memberCount],
  )

  return (
    <Center style={[{ width: size, height: size }, $container, style]}>
      <Center style={[{ width: size, height: size }, $container]}>
        <VStack style={themed($background)} />
        <Center style={$content}>
          {positions.map((pos, index) => {
            // Render member avatars (up to MAX_VISIBLE_MEMBERS)
            if (index < MAX_VISIBLE_MEMBERS && index < memberCount) {
              return (
                <Avatar
                  key={`avatar-${index}`}
                  uri={members[index].uri}
                  name={members[index].name}
                  sizeNumber={(pos.size / 100) * size}
                  style={{
                    left: (pos.x / 100) * size,
                    top: (pos.y / 100) * size,
                    position: "absolute",
                  }}
                />
              )
            }

            // Render "+N" indicator if there are more members than can be shown
            if (index === MAX_VISIBLE_MEMBERS && memberCount > MAX_VISIBLE_MEMBERS) {
              return (
                <ExtraMembersIndicator
                  key={`extra-${index}`}
                  pos={pos}
                  extraMembersCount={memberCount - MAX_VISIBLE_MEMBERS}
                  size={size}
                />
              )
            }

            return null
          })}
        </Center>
      </Center>
    </Center>
  )
})

/**
 * Calculate positions for avatars in the group avatar
 * Returns different layouts based on the number of members
 */
const calculatePositions = (memberCount: number, mainCircleRadius: number): Position[] => {
  const positionMaps: Record<number, Position[]> = {
    0: [],
    1: [{ x: mainCircleRadius - 50, y: mainCircleRadius - 50, size: 100 }],
    2: [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 47 },
      { x: mainCircleRadius, y: mainCircleRadius, size: 35 },
    ],
    3: [
      { x: mainCircleRadius * 0.27, y: mainCircleRadius * 0.27, size: 45 },
      { x: mainCircleRadius * 1.15, y: mainCircleRadius * 0.75, size: 35 },
      { x: mainCircleRadius * 0.6, y: mainCircleRadius * 1.2, size: 30 },
    ],
    4: [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
      { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
      { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
      { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
    ],
  }

  // Default layout for 5+ members
  return (
    positionMaps[memberCount] || [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
      { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
      { x: mainCircleRadius * 0.2, y: mainCircleRadius * 1.1, size: 15 },
      { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
      { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
    ]
  )
}

/**
 * Component to show "+N" indicator when there are more members than can be displayed
 */
const ExtraMembersIndicator = memo(function ExtraMembersIndicator(
  props: ExtraMembersIndicatorProps,
) {
  const { pos, extraMembersCount, size } = props
  const { theme, themed } = useAppTheme()

  const avatarSize = (pos.size / 100) * size
  const borderRadius = avatarSize / 2
  const fontSize = avatarSize / 2

  return (
    <Center
      style={[
        themed($extraMembersContainer),
        {
          left: (pos.x / 100) * size,
          top: (pos.y / 100) * size,
          width: avatarSize,
          height: avatarSize,
          borderRadius,
        },
      ]}
    >
      <Text
        style={[
          themed($extraMembersText),
          {
            color: theme.colors.global.white,
            fontSize,
          },
        ]}
      >
        +{extraMembersCount}
      </Text>
    </Center>
  )
})

// Styles
const $container: ViewStyle = {
  position: "relative",
  borderRadius: 999,
}

const $content: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

const $background: ThemedStyle<ViewStyle> = ({ colors }) => ({
  ...$globalStyles.absoluteFill,
  backgroundColor: colors.fill.minimal,
  borderRadius: 999,
})

const $extraMembersContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  backgroundColor: colors.fill.tertiary,
})

const $extraMembersText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text.primary,
})
