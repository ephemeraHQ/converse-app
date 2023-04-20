import { View, Text } from "react-native";

import { XmtpMessage } from "../../data/store/xmtpReducer";

type Props = {
  message: XmtpMessage;
};

export default function ChatMessage({ message }: Props) {
  return (
    <View style={{ height: 100, borderWidth: 1 }}>
      <Text>{message.content}</Text>
    </View>
  );
}
