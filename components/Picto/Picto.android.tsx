// import QuestionMark from "@material-symbols/svg-400/outlined/question_mark.svg";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";
import { SvgProps } from "react-native-svg";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

const iosToAndroidPictoMapping: {
  [key: string]: React.FC<SvgProps> | undefined;
} = {
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
  const AndroidPicto = iosToAndroidPictoMapping[picto];
  if (AndroidPicto) {
    return (
      <View style={[style]}>
        <AndroidPicto
          fill={color}
          width={size ? size * 1.5 : 48}
          height={size ? size * 1.5 : 48}
          viewBox="0 0 48 48"
        />
      </View>
    );
  } else {
    return <View style={[style]} />;
  }
}
