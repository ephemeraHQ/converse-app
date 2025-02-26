import { Text } from "@design-system/Text";
import { InboxId } from "@xmtp/react-native-sdk";
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info";

type IConversationMessageSenderProps = {
  inboxId: InboxId;
};

export function ConversationMessageSender(
  args: IConversationMessageSenderProps,
) {
  const { inboxId } = args;

  const { displayName, isLoading } = usePreferredDisplayInfo({
    inboxId,
  });

  if (!isLoading) {
    return null;
  }

  return (
    <Text preset="smaller" color="secondary">
      {displayName}
    </Text>
  );
}
