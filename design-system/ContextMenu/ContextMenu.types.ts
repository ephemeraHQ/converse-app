import { StyleProp, ViewStyle } from "react-native";

export type IMenuAnchorPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

/**
 * Props for the GestureHandler component.
 * @example
 * <GestureHandler>
 *   <TouchableOpacity>
 *     <Text>Open Menu</Text>
 *   </TouchableOpacity>
 * </GestureHandler>
 */
export type IGestureHandlerProps = {
  children: React.ReactElement | React.ReactElement[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Props for individual menu items within the ContextMenu.
 * @example
 * const menuItem: IMenuItemProps = {
 *   text: "Delete",
 *   icon: "trash",
 *   isDestructive: true,
 *   onPress: () => handleDelete()
 * }
 */
export type IMenuItemProps = {
  /** Text to display in the menu item */
  text: string;
  /** Icon to show before the text. Can be a string identifier or a custom component */
  icon?: string | (() => React.ReactElement);
  /** Callback function when the menu item is pressed */
  onPress?: (...args: any[]) => void;
  /** Makes the item appear as a non-interactive title */
  isTitle?: boolean;
  /** Applies destructive styling (usually red) to the item */
  isDestructive?: boolean;
  /** Adds a separator line below this item */
  withSeparator?: boolean;
  /** Optional custom styles for the menu item */
  style?: StyleProp<ViewStyle>;
};

/**
 * Props for the MenuList component that renders a list of menu items.
 * @example
 * <MenuList items={menuItems} />
 */
export type IMenuListProps = {
  items: IMenuItemProps[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Internal props used by the ContextMenu component.
 * @internal
 */
export type IMenuInternalProps = {
  /** Array of menu items to display */
  items: IMenuItemProps[];
  /** Height of each menu item in pixels */
  itemHeight: number;
  /** Width of the menu in pixels */
  itemWidth: number;
  /** Vertical position of the menu */
  itemY: number;
  /** Horizontal position of the menu */
  itemX: number;
  /** Position where the menu should anchor itself */
  anchorPosition: IMenuAnchorPosition;
  /** Total height of the menu */
  menuHeight: number;
  /** Transform value for animations */
  transformValue: number;
  /** Additional parameters for menu actions */
  actionParams: Record<string, (string | number)[]>;
  /** Optional custom styles for the menu container */
  style?: StyleProp<ViewStyle>;
};
