/**
 * Very minimalistic empty state component.
 * Feel free to extend it and add more props.
 */

import { memo } from "react"
import { View } from "react-native"
import { useHeaderHeight } from "@/design-system/Header/Header.utils"
import { Icon } from "@/design-system/Icon/Icon"
import { IIconName } from "@/design-system/Icon/Icon.types"
import { Text } from "@/design-system/Text"
import { IVStackProps, VStack } from "@/design-system/VStack"
import { useAppTheme } from "@/theme/use-app-theme"

type IEmptyStateProps = {
  title?: string
  description?: string
  iconName?: IIconName
  icon?: React.ReactNode
  containerStyle?: IVStackProps["style"]
  style?: IVStackProps["style"]
  hasScreenHeader?: boolean // Adds bottom padding so it can be centered when using it inside a screen that has a header
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  iconName,
  icon,
  containerStyle,
  style,
  hasScreenHeader = false,
}: IEmptyStateProps) {
  const { theme } = useAppTheme()

  const headerHeight = useHeaderHeight()

  return (
    <VStack
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: hasScreenHeader ? headerHeight : 0,
        },
        containerStyle,
        style,
      ]}
    >
      {(icon || iconName) && (
        <View style={{ marginBottom: theme.spacing.md }}>
          {icon || (iconName && <Icon icon={iconName} size={theme.iconSize.lg} />)}
        </View>
      )}

      {title && (
        <Text
          preset="title"
          style={{
            textAlign: "center",
            marginBottom: theme.spacing.xs,
          }}
        >
          {title}
        </Text>
      )}

      {description && (
        <Text
          color="secondary"
          style={{
            textAlign: "center",
          }}
        >
          {description}
        </Text>
      )}
    </VStack>
  )
})
