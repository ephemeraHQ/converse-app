import { ITextProps, Text } from "@design-system/Text"
import { memo, ReactNode } from "react"
import { ViewStyle } from "react-native"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { VStack } from "@/design-system/VStack"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

type ConversationSearchResultsListItemProps = {
  avatar?: ReactNode | undefined
  title: ReactNode
  subtitle: ReactNode
  onPress: () => void
}

export function ConversationSearchResultsListItem({
  avatar,
  title,
  subtitle,
  onPress,
}: ConversationSearchResultsListItemProps) {
  const { themed } = useAppTheme()

  return (
    <Pressable onPress={onPress} withHaptics>
      <HStack style={themed($container)}>
        {avatar}
        <VStack style={$globalStyles.flex1}>
          {typeof title === "string" ? (
            <ConversationSearchResultsListItemTitle>{title}</ConversationSearchResultsListItemTitle>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <ConversationSearchResultsListItemSubtitle>
              {subtitle}
            </ConversationSearchResultsListItemSubtitle>
          ) : (
            subtitle
          )}
        </VStack>
      </HStack>
    </Pressable>
  )
}

export const ConversationSearchResultsListItemTitle = memo(
  function ConversationSearchResultsListItemTitle(props: ITextProps) {
    return <Text preset="body" numberOfLines={1} {...props} />
  },
)

export const ConversationSearchResultsListItemSubtitle = memo(
  function ConversationSearchResultsListItemSubtitle(props: ITextProps) {
    return <Text color="secondary" preset="small" numberOfLines={1} {...props} />
  },
)

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  columnGap: spacing.xs,
})
