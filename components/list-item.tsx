import { memo, ReactNode } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { HStack } from "@/design-system/HStack"
import { ITextProps, Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

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
}

export const ListItem = memo(function ListItem(props: IListItemProps) {
  const { avatar, avatarName, avatarSource, title, subtitle, end, style } = props
  const { themed } = useAppTheme()

  return (
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
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
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
