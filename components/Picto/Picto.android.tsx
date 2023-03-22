import AccountCircle from "@material-symbols/svg-400/outlined/account_circle.svg";
import Chat from "@material-symbols/svg-400/outlined/chat.svg";
import Edit from "@material-symbols/svg-400/outlined/edit.svg";
import QrCodeScanner from "@material-symbols/svg-400/outlined/qr_code_scanner.svg";
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
  // xmark: "close",
  // paperplane: "send",
  // "chevron.right": "chevron_right",
  account_circle: AccountCircle,
  "square.and.pencil": Edit,
  qrcode: QrCodeScanner,
  "message.circle.fill": Chat,
  // signature: "vpn_key",
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
