## SpecStory

## Streamlining V3MessageSender Component (12/18/2024, 11:57:22 AM)

_**User**_

make this simpler by not having many component juste have V3MessageSender

---

_**Assistant**_

I'll help simplify the conversation-message-sender.tsx file by keeping only the V3MessageSender component and removing the unnecessary abstractions. Here's the simplified version:

```typescript:features/conversation/conversation-message/conversation-message-sender.tsx
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useAppTheme } from "@theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

type IV3MessageSenderProps = {
  inboxId: InboxId;
};

export function V3MessageSender(args: IV3MessageSenderProps) {
  const { inboxId } = args;
  const styles = useStyles();
  const name = usePreferredInboxName(inboxId);

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

  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderContainer: {
          flexDirection: "row",
          flexBasis: "100%",
          marginLeft: theme.spacing.xs,
          marginBottom: theme.spacing.xxxs,
        },
      }),
    [theme]
  );
};
```

Key changes made:
1. Removed `MessageSenderDumb` and `MessageSender` components
2. Kept only `V3MessageSender` as the main component
3. Removed unnecessary profile store imports
4. Simplified the component structure by inlining the sender name display
5. Updated props type to follow the naming convention with `I` prefix
6. Changed to use function declaration with args destructuring pattern

The component now has a single responsibility of displaying the sender name using the inbox ID, making it more maintainable and easier to understand.

---



---

