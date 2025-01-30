import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useAppTheme } from "@theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

type IConversationMessageSenderProps = {
  inboxId: InboxId;
};

export function ConversationMessageSender(
  args: IConversationMessageSenderProps
) {
  const { inboxId } = args;
  const styles = useStyles();
  const { data: name } = usePreferredInboxName({
    inboxId,
  });

  return (
    <VStack style={styles.groupSenderContainer}>
      <Text preset="smaller" color="secondary">
        {name}
      </Text>
    </VStack>
  );
}

const useStyles = () => {
  const { theme } = useAppTheme();
  const { messageContainerSidePadding } = useConversationMessageStyles();

  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderContainer: {
          flexDirection: "row",
          flexBasis: "100%",
          marginLeft: messageContainerSidePadding,
          marginBottom: theme.spacing.xxxs,
        },
      }),
    [theme, messageContainerSidePadding]
  );
};
