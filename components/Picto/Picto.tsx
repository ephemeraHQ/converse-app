import AccountCircle from "@material-symbols/svg-400/outlined/account_circle.svg";
import Add from "@material-symbols/svg-400/outlined/add.svg";
import AddLink from "@material-symbols/svg-400/outlined/add_link.svg";
import ArrowRight from "@material-symbols/svg-400/outlined/arrow_right.svg";
import AttachMoney from "@material-symbols/svg-400/outlined/attach_money.svg";
import Block from "@material-symbols/svg-400/outlined/block.svg";
import Call from "@material-symbols/svg-400/outlined/call.svg";
import ArrowUpRight from "@material-symbols/svg-400/outlined/call_made.svg";
import Celebration from "@material-symbols/svg-400/outlined/celebration.svg";
import Chat from "@material-symbols/svg-400/outlined/chat.svg";
import Close from "@material-symbols/svg-400/outlined/close.svg";
import ContentCopy from "@material-symbols/svg-400/outlined/content_copy.svg";
import Delete from "@material-symbols/svg-400/outlined/delete.svg";
import Done from "@material-symbols/svg-400/outlined/done.svg";
import Edit from "@material-symbols/svg-400/outlined/edit.svg";
import ExpandMore from "@material-symbols/svg-400/outlined/expand_more.svg";
import Image from "@material-symbols/svg-400/outlined/image.svg";
import Key from "@material-symbols/svg-400/outlined/key.svg";
import Laptop from "@material-symbols/svg-400/outlined/laptop_chromebook.svg";
import Link from "@material-symbols/svg-400/outlined/link.svg";
import Lock from "@material-symbols/svg-400/outlined/lock_open.svg";
import ChatNotification from "@material-symbols/svg-400/outlined/mark_chat_unread.svg";
import Menu from "@material-symbols/svg-400/outlined/menu.svg";
import MoreVert from "@material-symbols/svg-400/outlined/more_vert.svg";
import Person from "@material-symbols/svg-400/outlined/person.svg";
import PersonSearch from "@material-symbols/svg-400/outlined/person_search.svg";
import QrCodeScanner from "@material-symbols/svg-400/outlined/qr_code_scanner.svg";
import Refresh from "@material-symbols/svg-400/outlined/refresh.svg";
import Search from "@material-symbols/svg-400/outlined/search.svg";
import Send from "@material-symbols/svg-400/outlined/send.svg";
import Settings from "@material-symbols/svg-400/outlined/settings.svg";
import Signature from "@material-symbols/svg-400/outlined/signature.svg";
import WavingHand from "@material-symbols/svg-400/outlined/waving_hand.svg";
import {
  ColorValue,
  Platform,
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
  "lock.open.laptopcomputer": Laptop,
  trash: Delete,
  menu: Menu,
  more_vert: MoreVert,
  phone: Call,
  "chevron.down": ExpandMore,
  photo: Image,
  dollarsign: AttachMoney,
  gear: Settings,
  "arrow.clockwise": Refresh,
  person: Person,
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  const SvgPicto = pictoMapping[picto];
  const colorScheme = useColorScheme();
  if (SvgPicto) {
    const pictoSize = (size || 48) + (Platform.OS === "web" ? 6 : 0);
    return (
      <View style={[style]}>
        <SvgPicto
          fill={color || primaryColor(colorScheme)}
          width={pictoSize}
          height={pictoSize}
          viewBox="0 0 48 48"
        />
      </View>
    );
  } else {
    return <View style={[style]} />;
  }
}
