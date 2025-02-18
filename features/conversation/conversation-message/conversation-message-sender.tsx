import { useProfileQuery } from "@/features/profiles/profiles.query";
import { Text } from "@design-system/Text";
import { InboxId } from "@xmtp/react-native-sdk";

type IConversationMessageSenderProps = {
  inboxId: InboxId;
};

export function ConversationMessageSender(
  args: IConversationMessageSenderProps
) {
  const { inboxId } = args;

  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
  });

  if (!profile) {
    return null;
  }

  return (
    <Text preset="smaller" color="secondary">
      {profile.name}
    </Text>
  );
}
