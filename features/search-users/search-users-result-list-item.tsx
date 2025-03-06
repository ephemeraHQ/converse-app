import { ITextProps, Text } from "@design-system/Text"
import { memo, ReactNode } from "react"
import { ViewStyle } from "react-native"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { VStack } from "@/design-system/VStack"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

export type SearchResultsListItemProps = {
  avatar?: ReactNode
  title: ReactNode
  subtitle: ReactNode
  endElement?: ReactNode
  onPress: () => void
}

export function SearchUsersResultListItem({
  avatar,
  title,
  subtitle,
  endElement,
  onPress,
}: SearchResultsListItemProps) {
  const { themed } = useAppTheme()

  return (
    <Pressable onPress={onPress} withHaptics>
      <HStack style={themed($container)}>
        {avatar}
        <VStack style={$globalStyles.flex1}>
          {typeof title === "string" ? (
            <SearchResultsListItemTitle>{title}</SearchResultsListItemTitle>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <SearchResultsListItemSubtitle>{subtitle}</SearchResultsListItemSubtitle>
          ) : (
            subtitle
          )}
        </VStack>
        {endElement}
      </HStack>
    </Pressable>
  )
}

export const SearchResultsListItemTitle = memo(function SearchResultsListItemTitle(
  props: ITextProps,
) {
  return <Text preset="body" numberOfLines={1} {...props} />
})

export const SearchResultsListItemSubtitle = memo(function SearchResultsListItemSubtitle(
  props: ITextProps,
) {
  return <Text color="secondary" preset="small" numberOfLines={1} {...props} />
})

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  columnGap: spacing.xs,
  alignItems: "center",
})
