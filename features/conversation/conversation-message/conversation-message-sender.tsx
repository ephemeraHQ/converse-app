import { Text } from "@design-system/Text";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { InboxId } from "@xmtp/react-native-sdk";

type IConversationMessageSenderProps = {
  inboxId: InboxId;
};

export function ConversationMessageSender(
  args: IConversationMessageSenderProps
) {
  const { inboxId } = args;
  const { data: name } = usePreferredInboxName({
    inboxId,
  });

  return (
    <Text preset="smaller" color="secondary">
      {name}
    </Text>
  );
}
