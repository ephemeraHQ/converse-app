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

export type IIconProps = {
  icon?: IIconName;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;

  /**
   * @deprecated
   */
  weight?: string;
  /**
   * @deprecated Use icon instead
   */
  picto?: IIconName;
};
