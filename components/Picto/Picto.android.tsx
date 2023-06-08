import AccountCircle from "@material-symbols/svg-400/outlined/account_circle.svg";
import Add from "@material-symbols/svg-400/outlined/add.svg";
import AddLink from "@material-symbols/svg-400/outlined/add_link.svg";
import ArrowRight from "@material-symbols/svg-400/outlined/arrow_right.svg";
import Block from "@material-symbols/svg-400/outlined/block.svg";
import ArrowUpRight from "@material-symbols/svg-400/outlined/call_made.svg";
import Celebration from "@material-symbols/svg-400/outlined/celebration.svg";
import Chat from "@material-symbols/svg-400/outlined/chat.svg";
import Close from "@material-symbols/svg-400/outlined/close.svg";
import ContentCopy from "@material-symbols/svg-400/outlined/content_copy.svg";
import Done from "@material-symbols/svg-400/outlined/done.svg";
import Edit from "@material-symbols/svg-400/outlined/edit.svg";
import Key from "@material-symbols/svg-400/outlined/key.svg";
import Link from "@material-symbols/svg-400/outlined/link.svg";
import Lock from "@material-symbols/svg-400/outlined/lock_open.svg";
import ChatNotification from "@material-symbols/svg-400/outlined/mark_chat_unread.svg";
import PersonSearch from "@material-symbols/svg-400/outlined/person_search.svg";
import QrCodeScanner from "@material-symbols/svg-400/outlined/qr_code_scanner.svg";
import Search from "@material-symbols/svg-400/outlined/search.svg";
import Send from "@material-symbols/svg-400/outlined/send.svg";
import Signature from "@material-symbols/svg-400/outlined/signature.svg";
import WavingHand from "@material-symbols/svg-400/outlined/waving_hand.svg";
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
  account_circle: AccountCircle,
  "square.and.pencil": Edit,
  qrcode: QrCodeScanner,
  "message.circle.fill": Chat,
  signature: Signature,
  "message.badge": ChatNotification,
  search: Search,
  addlink: AddLink,
  "key.horizontal": Key,
  "hand.wave": WavingHand,
  "square.and.arrow.up": Send,
  "doc.on.doc": ContentCopy,
  "party.popper": Celebration,
  "lock.open": Lock,
  eyes: PersonSearch,
  message: Chat,
  checkmark: Done,
  block: Block,
  "chevron.right": ArrowRight,
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
