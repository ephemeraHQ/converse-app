import { Text } from "@design-system/Text";
import { useInboxName } from "@hooks/useInboxName";
import { InboxId } from "@xmtp/react-native-sdk";

type IConversationMessageSenderProps = {
  inboxId: InboxId;
};

export function ConversationMessageSender(
  args: IConversationMessageSenderProps
) {
  const { inboxId } = args;
  const { data: name } = useInboxName({
    inboxId,
  });

  return (
    <Text preset="smaller" color="secondary">
      {name}
    </Text>
  );
}
