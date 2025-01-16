import { useCallback, useMemo } from "react";
import {
  MenuView,
  NativeActionEvent,
  MenuAction as RNMenuAction,
} from "@react-native-menu/menu";
import { Platform, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "../Pressable";
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { getInlinedItem } from "./dropdown-menu.utils";

export type IDropdownMenuAction = Omit<
  RNMenuAction,
  "titleColor" | "imageColor"
> & {
  color?: string;
};

type IDropdownMenuProps = {
  actions: IDropdownMenuAction[];
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (actionId: string) => void;
};

export const DropdownMenu = ({
  children,
  actions,
  style,
  onPress,
}: IDropdownMenuProps) => {
  const { theme } = useAppTheme();

  const themedActions: RNMenuAction[] = useMemo(() => {
    return actions.map((action) => {
      const themedAction = {
        ...action,
        // AR: Right now Android will only show a background color of white, so don't set a titleColor which is android specific anyways
        // This may be only an android 13 issue though, will either need to fix the library or wait for a fix
        titleColor: action.color ?? theme.colors.global.primary,
        imageColor:
          action.color ??
          (Platform.OS === "android" ? theme.colors.global.primary : undefined),
        displayInline: action.displayInline,
      };
      return action.displayInline ? getInlinedItem(themedAction) : themedAction;
    });
  }, [actions, theme.colors.global.primary]);

  const handlePress = useCallback(
    ({ nativeEvent }: NativeActionEvent) => {
      Haptics.selectionAsync();
      onPress?.(nativeEvent.event);
    },
    [onPress]
  );

  return (
    <MenuView
      onPressAction={handlePress}
      actions={themedActions}
      style={style}
      shouldOpenOnLongPress={false}
    >
      <Pressable style={$pressable}>{children}</Pressable>
    </MenuView>
  );
};

const $pressable: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
};
