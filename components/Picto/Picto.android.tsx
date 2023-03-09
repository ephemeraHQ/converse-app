import { ColorValue, StyleProp, View, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

const iosToAndroidPictoMapping: { [key: string]: string } = {
  // xmark: "close",
  // paperplane: "send",
  // "chevron.right": "chevron_right",
  // "square.and.pencil": "edit",
  // qrcode: "qr_code",
  // "message.circle.fill": "chat_bubble",
  // signature: "vpn_key",
  // "square.and.arrow.up": "share",
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  const androidPicto = iosToAndroidPictoMapping[picto];
  const icon = androidPicto ? (
    <Icon name={androidPicto} size={size} color={color} />
  ) : (
    <Icon name="circle-outline" size={30} color={color} />
  );
  return <View style={style}>{icon}</View>;
}
