import { useAppTheme } from "@theme/useAppTheme";
import logger from "@utils/logger";
import { SFSymbol } from "react-native-sfsymbols";

import { IIconName, IIconProps } from "./Icon.types";

// For now we don't have tpying for SFSymbols but we use a 1-1 with the key name
export const iconRegistry: Record<IIconName, string> = {
  xmark: "xmark",
  "xmark.circle.fill": "xmark.circle.fill",
  plus: "plus",
  "arrow.up.right": "arrow.up.right",
  "arrow.down": "arrow.down",
  link: "link",
  paperplane: "paperplane",
  account_circle: "person.circle",
  "square.and.pencil": "square.and.pencil",
  qrcode: "qrcode",
  "message.circle.fill": "message.circle.fill",
  signature: "signature",
  "message.badge": "message.badge",
  "checkmark.message": "checkmark.message",
  search: "magnifyingglass",
  addlink: "link.badge.plus",
  "key.horizontal": "key",
  key: "key",
  "hand.wave": "hand.wave",
  "square.and.arrow.up": "square.and.arrow.up",
  "doc.on.doc": "doc.on.doc",
  "party.popper": "party.popper",
  "lock.open": "lock.open",
  lock: "lock",
  eyes: "eye",
  message: "message",
  checkmark: "checkmark",
  block: "nosign",
  "chevron.left": "chevron.left",
  "chevron.right": "chevron.right",
  "arrow.right.circle.fill": "arrow.right.circle.fill",
  "lock.open.laptopcomputer": "lock.open.laptopcomputer",
  trash: "trash",
  menu: "line.3.horizontal",
  more_vert: "ellipsis",
  phone: "phone",
  "chevron.down": "chevron.down",
  photo: "photo",
  dollarsign: "dollarsign",
  gear: "gear",
  "arrow.clockwise": "arrow.clockwise",
  person: "person",
  exclamation: "exclamationmark",
  "info.circle": "info.circle",
  "person.2": "person.2",
  "arrowshape.turn.up.left": "arrowshape.turn.up.left",
  "person.crop.circle.badge.plus": "person.crop.circle.badge.plus",
  tray: "tray",
  cloud: "cloud",
  "exclamationmark.triangle": "exclamationmark.triangle",
  magnifyingglass: "magnifyingglass",
  star: "star",
};

export function Icon(props: IIconProps) {
  const { theme } = useAppTheme();

  const {
    picto,
    icon,
    style,
    size = theme.iconSize.lg,
    color = theme.colors.fill.primary,
  } = props;

  const iconName = icon ? iconRegistry[icon] : picto ? iconRegistry[picto] : "";

  if (!iconName) {
    logger.warn(`No icon name found for picto with ${icon || picto}`);
    return null;
  }

  return (
    <SFSymbol
      name={iconName}
      color={color}
      size={size}
      multicolor={false}
      resizeMode="center"
      style={[{ width: size, height: size }, style]}
    />
  );
}
