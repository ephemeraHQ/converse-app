import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { TouchableWithoutFeedback } from "@/design-system/touchable-without-feedback";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useAppTheme } from "@/theme/useAppTheme";
import { Button } from "@design-system/Button/Button";
import { Keyboard } from "react-native";

type IConversationNewDmNoMessagesPlaceholderProps = {
  peerAddress: string;
  onSendWelcomeMessage: () => void;
  isBlockedPeer: boolean;
};

export function ConversationNewDmNoMessagesPlaceholder(
  args: IConversationNewDmNoMessagesPlaceholderProps
) {
  const { peerAddress, onSendWelcomeMessage, isBlockedPeer } = args;

  const { theme } = useAppTheme();

  const peerPreferredName = usePreferredName(peerAddress);

  if (isBlockedPeer) {
    // TODO
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Center
        style={{
          flex: 1,
          flexDirection: "column",
          paddingHorizontal: theme.spacing.md,
          rowGap: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          This is the beginning of your{"\n"}conversation with{" "}
          {peerPreferredName}
        </Text>
        <Button
          variant="fill"
          icon="hand.wave"
          text="Say hi"
          onPress={onSendWelcomeMessage}
        />
      </Center>
    </TouchableWithoutFeedback>
  );
}
