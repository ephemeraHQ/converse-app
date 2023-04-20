import { FlashList } from "@shopify/flash-list";
import {
  ColorSchemeName,
  useColorScheme,
  InputAccessoryView,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XmtpConversation } from "../../data/store/xmtpReducer";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

type Props = {
  conversation: XmtpConversation | undefined;
};

export default function Chat({ conversation }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const messagesArray = Array.from(
    conversation ? conversation.messages.values() : []
  ).reverse();
  const insets = useSafeAreaInsets();
  const chatInputHeight = 25;
  return (
    <View style={styles.chatContainer}>
      <FlashList
        contentContainerStyle={styles.chat}
        data={messagesArray}
        renderItem={({ item }) => <ChatMessage message={item} />}
        estimatedItemSize={100}
        keyboardDismissMode="interactive"
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        inverted
        automaticallyAdjustKeyboardInsets
        keyExtractor={(item) => item.id}
      />
      <View
        style={{
          backgroundColor: "red",
          height: chatInputHeight + insets.bottom,
        }}
      >
        {Platform.OS === "ios" && (
          <InputAccessoryView
            style={{ height: chatInputHeight }}
            backgroundColor="blue"
          >
            <ChatInput />
          </InputAccessoryView>
        )}
        {Platform.OS !== "ios" && <ChatInput />}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) => ({
  chatContainer: {
    flex: 1,
    backgroundColor: "green",
  },
  chat: {
    backgroundColor: "yellow",
  },
});
