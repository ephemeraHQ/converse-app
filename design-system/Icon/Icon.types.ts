import { ColorValue, StyleProp, TextStyle, ViewStyle } from "react-native";
import { RequireExactlyOne } from "../../types/general";
import { iconRegistry } from "@/design-system/Icon/Icon";

export type IIconName =
  | "xmark"
  | "xmark.circle.fill"
  | "plus"
  | "arrow.up"
  | "arrow.up.right"
  | "arrow.down"
  | "link"
  | "paperplane"
  | "account_circle"
  | "pencil"
  | "square.and.pencil"
  | "qrcode"
  | "message.circle.fill"
  | "signature"
  | "message.badge"
  | "checkmark.message"
  | "search"
  | "addlink"
  | "key.horizontal"
  | "key"
  | "hand.wave"
  | "square.and.arrow.up"
  | "doc.on.doc"
  | "party.popper"
  | "lock.open"
  | "lock"
  | "eyes"
  | "message"
  | "checkmark"
  | "block"
  | "chevron.left"
  | "chevron.right"
  | "arrow.right.circle.fill"
  | "lock.open.laptopcomputer"
  | "trash"
  | "menu"
  | "more_vert"
  | "phone"
  | "chevron.down"
  | "photo"
  | "dollarsign"
  | "gear"
  | "arrow.clockwise"
  | "person"
  | "exclamation"
  | "info.circle"
  | "person.2"
  | "arrowshape.turn.up.left"
  | "arrowshape.turn.up.left.fill"
  | "person.crop.circle.badge.plus"
  | "person.crop.circle.badge.xmark"
  | "tray"
  | "cloud"
  | "exclamationmark.triangle"
  | "magnifyingglass"
  | "star"
  | "pin"
  | "pin.slash"
  | "shield"
  | "shield.fill"
  | "new-account-card"
  | "settings";

/**
 * Props for the Icon component.
 * @example
 * <Icon icon="search" size={24} color="blue" />
 */
export type IIconProps = RequireExactlyOne<{
  icon: IIconName;
  /**
   * @deprecated Use icon instead
   * @example
   * Before: <Icon picto="search" />
   * After: <Icon icon="search" />
   */
  picto: IIconName;
}> & {
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  /**
   * Icon size in pixels (positive number)
   * @default 24
   */
  size?: number;

  /**
   * @deprecated
   * Weight property is no longer supported and will be removed in the next major version.
   * @see Use different icon names for different weights instead.
   */
  weight?: string;
};
