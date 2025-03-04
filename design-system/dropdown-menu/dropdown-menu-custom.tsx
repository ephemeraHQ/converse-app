import { Pressable } from "react-native"
import { HStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { IIconName } from "@/design-system/Icon/Icon.types"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useAppTheme } from "@/theme/use-app-theme"

type IMenuListContainerProps = {
  children: React.ReactNode
}

export function DropdownMenuContainer({ children }: IMenuListContainerProps) {
  const { theme } = useAppTheme()

  const { containerWidth } = useDropdownMenuCustomStyles()

  return (
    <VStack
      separator={
        <HStack
          style={{
            height: theme.borderWidth.xs,
            backgroundColor: theme.colors.border.subtle,
            width: "100%",
          }}
        />
      }
      style={{
        width: containerWidth,
        backgroundColor: theme.colors.background.raised,
        borderRadius: theme.borderRadius.xs,
      }}
    >
      {children}
    </VStack>
  )
}

export type IDropdownMenuCustomItemProps = {
  label: string
  iconName?: IIconName
  onPress?: () => void
}

export function DropdownMenuCustomItem({ label, iconName, onPress }: IDropdownMenuCustomItemProps) {
  const { theme } = useAppTheme()

  const { itemHeight } = useDropdownMenuCustomStyles()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.sm,
        height: itemHeight,
        columnGap: theme.spacing.sm,
      })}
    >
      <Text>{label}</Text>
      {iconName && (
        <VStack>
          <Icon size={theme.iconSize.sm} icon={iconName} />
        </VStack>
      )}
    </Pressable>
  )
}

export function useDropdownMenuCustomStyles() {
  return {
    containerWidth: 181, // From Figma
    itemHeight: 44, // From Figma
  }
}
