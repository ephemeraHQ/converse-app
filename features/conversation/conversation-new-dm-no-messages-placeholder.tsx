import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { TouchableWithoutFeedback } from "@/design-system/touchable-without-feedback";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
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
          {translate("this_is_the_beginning_of_your_conversation_with", {
            name: peerPreferredName,
          })}
        </Text>
        <Button
          variant="fill"
          icon="hand.wave"
          tx="say_hi"
          onPress={onSendWelcomeMessage}
        />
      </Center>
    </TouchableWithoutFeedback>
  );
}
