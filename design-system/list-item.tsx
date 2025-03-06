import { memo, ReactNode } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { ConditionalWrapper } from "@/components/conditional-wrapper"
import { Center } from "@/design-system/Center"
import { HStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { Pressable } from "@/design-system/Pressable"
import { ITextProps, Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"

// Reusable title component
export const ListItemTitle = memo(function ListItemTitle(props: ITextProps) {
  return <Text {...props} />
})

// Reusable subtitle component
export const ListItemSubtitle = memo(function ListItemSubtitle(props: ITextProps) {
  return <Text preset="small" color="secondary" {...props} />
})

export type IListItemProps = {
  avatar?: ReactNode
  avatarName?: string
  avatarSource?: string
  title: ReactNode | string
  subtitle?: ReactNode | string
  end?: ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export const ListItem = memo(function ListItem(props: IListItemProps) {
  const { avatar, avatarName, avatarSource, title, subtitle, end, style, onPress } = props
  const { themed } = useAppTheme()

  const content = (
    <HStack style={[themed($container), style]}>
      <HStack style={themed($content)}>
        {avatarName || avatarSource ? (
          <Avatar size="md" uri={avatarSource} name={avatarName} />
        ) : (
          avatar
        )}
        <VStack style={themed($textContainer)}>
          <ListItemTitle>{title}</ListItemTitle>
          {subtitle && <ListItemSubtitle>{subtitle}</ListItemSubtitle>}
        </VStack>
        {end && <HStack style={themed($end)}>{end}</HStack>}
      </HStack>
    </HStack>
  )

  return (
    <ConditionalWrapper
      condition={!!onPress}
      wrapper={(children) => <Pressable onPress={onPress}>{children}</Pressable>}
    >
      {content}
    </ConditionalWrapper>
  )
})

export const ListItemEndRightChevron = memo(function ListItemEndRightChevron() {
  const { theme } = useAppTheme()
  return (
    <Center
      style={{
        width: theme.spacing.lg,
        height: theme.spacing.lg,
      }}
    >
      <Icon icon="chevron.right" size={theme.iconSize.sm} color={theme.colors.text.secondary} />
    </Center>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  columnGap: spacing.xs,
  minHeight: spacing.xxl,
})

const $textContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
})

const $end: ThemedStyle<ViewStyle> = ({ spacing }) => ({})
