import { useAppTheme } from "@theme/useAppTheme";
import logger from "@utils/logger";
import { useMemo } from "react";
import { SFSymbol } from "react-native-sfsymbols";
import { IIconName, IIconProps } from "./Icon.types";

// For now we don't have tpying for SFSymbols but we use a 1-1 with the key name
export const iconRegistry: Record<IIconName, string> = {
  xmark: "xmark",
  "xmark.circle.fill": "xmark.circle.fill",
  plus: "plus",
  "arrow.up": "arrow.up",
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
  "arrowshape.turn.up.left.fill": "arrowshape.turn.up.left.fill",
  "person.crop.circle.badge.plus": "person.crop.circle.badge.plus",
  tray: "tray",
  cloud: "cloud",
  "exclamationmark.triangle": "exclamationmark.triangle",
  magnifyingglass: "magnifyingglass",
  star: "star",
};

export function Icon(props: IIconProps) {
  const { theme } = useAppTheme();

  const defaultSize = useMemo(() => theme.iconSize.lg, [theme]);

  const defaultColor = useMemo(() => theme.colors.fill.primary, [theme]);

  const {
    picto,
    icon,
    style,
    size = defaultSize,
    color = defaultColor,
    weight,
    ...rest
  } = props;

  if (!icon && !picto) {
    throw new Error("Either 'icon' or 'picto' must be provided");
  }

  if (icon && picto) {
    logger.warn(
      "Both 'icon' and 'picto' provided, 'icon' will take precedence"
    );
  }

  const iconName = icon
    ? iconRegistry[icon]
    : picto
      ? iconRegistry[picto]
      : null;

  if (!iconName) {
    logger.warn(
      `Invalid icon name: "${
        icon || picto
      }". Please check design-system/Icon/Icon.types.ts for valid options.`
    );
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
      {...rest}
    />
  );
}
