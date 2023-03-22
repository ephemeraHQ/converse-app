import AccountCircle from "@material-symbols/svg-400/outlined/account_circle.svg";
import Add from "@material-symbols/svg-400/outlined/add.svg";
import ArrowUpRight from "@material-symbols/svg-400/outlined/call_made.svg";
import Chat from "@material-symbols/svg-400/outlined/chat.svg";
import Close from "@material-symbols/svg-400/outlined/close.svg";
import Edit from "@material-symbols/svg-400/outlined/edit.svg";
import Link from "@material-symbols/svg-400/outlined/link.svg";
import ChatNotification from "@material-symbols/svg-400/outlined/mark_chat_unread.svg";
import QrCodeScanner from "@material-symbols/svg-400/outlined/qr_code_scanner.svg";
import Send from "@material-symbols/svg-400/outlined/send.svg";
import Signature from "@material-symbols/svg-400/outlined/signature.svg";
import {
  ColorValue,
  StyleProp,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { SvgProps } from "react-native-svg";

import { primaryColor } from "../../utils/colors";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

const pictoMapping: {
  [key: string]: React.FC<SvgProps> | undefined;
} = {
  xmark: Close,
  plus: Add,
  "arrow.up.right": ArrowUpRight,
  link: Link,
  paperplane: Send,
  // "chevron.right": "chevron_right",
  account_circle: AccountCircle,
  "square.and.pencil": Edit,
  qrcode: QrCodeScanner,
  "message.circle.fill": Chat,
  signature: Signature,
  "message.badge": ChatNotification,
  // "square.and.arrow.up": "share",
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  const AndroidPicto = pictoMapping[picto];
  const colorScheme = useColorScheme();
  if (AndroidPicto) {
    return (
      <View style={[style]}>
        <AndroidPicto
          fill={color || primaryColor(colorScheme)}
          width={size || 48}
          height={size || 48}
          viewBox="0 0 48 48"
        />
      </View>
    );
  } else {
    return <View style={[style]} />;
  }
}
