## SpecStory

## Code Cleanup and Component Simplification (12/18/2024, 6:26:05 PM)

_**User**_

make cleaner, rmeove the dumb file just put all in one component

---

_**Assistant**_

I'll help clean up the file by combining the components and removing unused code. Here's the simplified version:

```typescript:features/conversation/conversation-message/conversation-message-sender-avatar.tsx
import Avatar from "@components/Avatar";
import { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { useAppTheme } from "@theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { navigate } from "../../../utils/navigation";
import { getPreferredInboxAvatar } from "../../../utils/profile";

type IConversationSenderAvatarProps = {
  inboxId: InboxId;
};

export function ConversationSenderAvatar({ inboxId }: IConversationSenderAvatarProps) {
  const { theme } = useAppTheme();
  const currentAccount = useCurrentAccount();
  const { data: senderSocials } = useInboxProfileSocialsQuery(currentAccount!, inboxId);
  const address = usePreferredInboxAddress(inboxId);
  const name = usePreferredInboxName(inboxId);
  const avatarUri = getPreferredInboxAvatar(senderSocials);

  const openProfile = useCallback(() => {
    if (address) {
      navigate("Profile", { address });
    }
  }, [address]);

  const styles = useStyles();

  return (
    <View style={styles.groupSenderAvatarWrapper}>
      <TouchableOpacity onPress={openProfile}>
        <Avatar
          size={theme.layout.chat.messageSenderAvatar.width}
          uri={avatarUri}
          name={name}
        />
      </TouchableOpacity>
    </View>
  );
}

const useStyles = () => {
  const { theme } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderAvatarWrapper: {},
      }),
    [theme]
  );
};
```

Key changes made:
1. Removed the `MessageSenderAvatarDumb` component and merged its functionality into `ConversationSenderAvatar`
2. Removed commented-out code and unused props/components
3. Removed unused styles
4. Renamed the props type to follow the `I` prefix convention
5. Changed to function declaration syntax
6. Simplified the component structure to be more direct

The component now has a single responsibility of displaying an avatar for a conversation sender, with the ability to navigate to their profile when clicked.

---



---

