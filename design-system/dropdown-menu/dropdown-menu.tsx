import { MenuView, NativeActionEvent, MenuAction as RNMenuAction } from "@react-native-menu/menu"
import { useCallback, useMemo } from "react"
import { Platform, StyleProp, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"
import { Haptics } from "@/utils/haptics"
import { Pressable } from "../Pressable"
import { getInlinedItem } from "./dropdown-menu.utils"

export type IDropdownMenuAction = Omit<RNMenuAction, "titleColor" | "imageColor"> & {
  color?: string
}

type IDropdownMenuProps = {
  actions: IDropdownMenuAction[]
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: (actionId: string) => void
  shouldOpenOnLongPress?: boolean
  disabled?: boolean
}

export const DropdownMenu = ({
  children,
  actions,
  style,
  onPress,
  shouldOpenOnLongPress = false,
  disabled = false,
}: IDropdownMenuProps) => {
  const { theme } = useAppTheme()

  const themedActions: RNMenuAction[] = useMemo(() => {
    return actions.map((action) => {
      const themedAction = {
        ...action,
        // AR: Right now Android will only show a background color of white, so don't set a titleColor which is android specific anyways
        // This may be only an android 13 issue though, will either need to fix the library or wait for a fix
        titleColor: action.color ?? theme.colors.global.primary,
        imageColor:
          action.color ?? (Platform.OS === "android" ? theme.colors.global.primary : undefined),
        displayInline: action.displayInline,
      }
      return action.displayInline ? getInlinedItem(themedAction) : themedAction
    })
  }, [actions, theme.colors.global.primary])

  const handlePress = useCallback(
    ({ nativeEvent }: NativeActionEvent) => {
      Haptics.selectionAsync()
      onPress?.(nativeEvent.event)
    },
    [onPress],
  )

  if (disabled) {
    return <Pressable style={[$pressable, style]}>{children}</Pressable>
  }

  return (
    <MenuView
      onPressAction={handlePress}
      actions={themedActions}
      style={style}
      shouldOpenOnLongPress={shouldOpenOnLongPress}
    >
      <Pressable style={$pressable}>{children}</Pressable>
    </MenuView>
  )
}

const $pressable: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}
