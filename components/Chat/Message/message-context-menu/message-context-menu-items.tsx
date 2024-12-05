import TableView, { TableViewItemType } from "@/components/TableView/TableView";
import { AnimatedVStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo, useCallback } from "react";
import { EntryAnimationsValues, withSpring } from "react-native-reanimated";
import { Platform } from "react-native";
import { MENU_ITEMS_WIDTH } from "./message-context-menu-constant";

export const MessageContextMenuItems = memo(
  function MessageContextMenuItems(props: {
    menuItems: TableViewItemType[];
    originY: number;
    originX: number;
  }) {
    const { theme } = useAppTheme();

    const { menuItems: items, originY, originX } = props;

    const customEnteringAnimation = useCallback(
      (targetValues: EntryAnimationsValues) => {
        "worklet";

        const animations = {
          originX: withSpring(
            targetValues.targetOriginX,
            theme.animation.contextMenuSpring
          ),
          originY: withSpring(
            targetValues.targetOriginY,
            theme.animation.contextMenuSpring
          ),
          opacity: withSpring(1, theme.animation.contextMenuSpring),
          transform: [
            { scale: withSpring(1, theme.animation.contextMenuSpring) },
          ],
        };

        const initialValues = {
          originX: originX - MENU_ITEMS_WIDTH / 2,
          originY: originY,
          opacity: 0,
          transform: [{ scale: 0 }],
        };

        return {
          initialValues,
          animations,
        };
      },
      [theme.animation.contextMenuSpring, originX, originY]
    );

    return (
      <AnimatedVStack style={{ zIndex: -1 }} entering={customEnteringAnimation}>
        <TableView
          items={items}
          style={{
            width: MENU_ITEMS_WIDTH,
            backgroundColor:
              Platform.OS === "android"
                ? theme.colors.background.raised
                : undefined,
            borderRadius: Platform.OS === "android" ? 10 : undefined,
          }}
        />
      </AnimatedVStack>
    );
  }
);
