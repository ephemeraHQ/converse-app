import { MaterialIcons } from "@expo/vector-icons"
import { logger } from "@utils/logger"
import { StyleProp, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"
import { IIconName, IIconProps } from "./Icon.types"

export const iconRegistry: Record<IIconName, keyof typeof MaterialIcons.glyphMap> = {
  xmark: "close",
  "xmark.circle.fill": "cancel",
  plus: "add",
  "arrow.up": "arrow-upward",
  "arrow.up.right": "north-east",
  "arrow.down": "arrow-downward",
  link: "link",
  paperplane: "send",
  account_circle: "account-circle",
  pencil: "edit",
  "square.and.pencil": "edit",
  qrcode: "qr-code",
  "message.circle.fill": "chat",
  signature: "draw",
  "message.badge": "mark-chat-unread",
  "checkmark.message": "chat",
  search: "search",
  addlink: "add-link",
  "key.horizontal": "key",
  key: "key",
  "hand.wave": "waving-hand",
  "square.and.arrow.up": "ios-share",
  "doc.on.doc": "content-copy",
  "party.popper": "celebration",
  "lock.open": "lock-open",
  lock: "lock",
  eyes: "visibility",
  message: "message",
  checkmark: "check",
  block: "block",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.up": "expand-less",
  "arrow.right.circle.fill": "arrow-circle-right",
  "lock.open.laptopcomputer": "laptop",
  trash: "delete",
  menu: "menu",
  more_vert: "more-vert",
  phone: "phone",
  "chevron.down": "expand-more",
  photo: "photo",
  photos: "photo-library",
  dollarsign: "attach-money",
  gear: "settings",
  "arrow.clockwise": "refresh",
  person: "person",
  exclamation: "error",
  "info.circle": "info",
  "person.2": "group",
  "arrowshape.turn.up.left": "reply",
  "arrowshape.turn.up.left.fill": "reply",
  "person.crop.circle.badge.plus": "group-add",
  "person.crop.circle.badge.xmark": "person-remove",
  tray: "inbox",
  cloud: "cloud",
  "exclamationmark.triangle": "warning",
  magnifyingglass: "search",
  star: "star",
  pin: "push-pin",
  "pin.slash": "push-pin", // Doesn't seem like there's a pin.slash icon
  shield: "shield",
  "shield.fill": "shield",
  "new-account-card": "person",
  settings: "settings",
  restore: "restore",
  biometric: "fingerprint",
  camera: "camera",
  "contact-card": "person",
  "person-badge-key": "person",
}

export function Icon(props: IIconProps) {
  const { theme } = useAppTheme()

  const {
    picto,
    icon,
    size = theme.iconSize.lg,
    color = theme.colors.fill.primary,
    ...rest
  } = props

  if (!icon && !picto) {
    throw new Error("Either 'icon' or 'picto' must be provided")
  }

  const iconName = icon ? iconRegistry[icon] : picto ? iconRegistry[picto] : null

  if (!iconName) {
    logger.warn(`Invalid icon name ${icon || picto}`)
    return null
  }

  return (
    <MaterialIcons
      {...rest}
      style={rest.style as StyleProp<TextStyle>}
      name={iconName}
      size={size}
      color={color}
    />
  )
}
