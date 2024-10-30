import { ColorValue, StyleProp, ViewStyle } from "react-native";

export type IIconName =
  | "xmark"
  | "xmark.circle.fill"
  | "plus"
  | "arrow.up.right"
  | "arrow.down"
  | "link"
  | "paperplane"
  | "account_circle"
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
  | "person.crop.circle.badge.plus"
  | "tray"
  | "cloud"
  | "exclamationmark.triangle"
  | "magnifyingglass"
  | "star";

/**
 * Props for the Icon component.
 * @example
 * <Icon icon="search" size={24} color="blue" />
 */
export type IIconProps = {
  icon?: IIconName;
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
  /**
   * @deprecated Use icon instead
   * @example
   * Before: <Icon picto="search" />
   * After: <Icon icon="search" />
   */
  picto?: IIconName;
};
