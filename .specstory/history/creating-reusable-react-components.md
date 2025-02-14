## SpecStory

## Creating Reusable React Components (11/27/2024, 1:59:13 PM)

_**User**_

create external components so that i can reuse in other places like a container, the title and a button

---

_**Assistant**_

To refactor the `DmConsentPopup` component and make it more reusable, we can extract the container, title, and button into separate components. This will allow you to reuse these components in other parts of your application. Here's how you can do it:

1. **Create a `Container` component** for the main layout.
2. **Create a `Title` component** for displaying the text.
3. **Create a `ConsentButton` component** for the buttons.

Here's how you can refactor the code:

### Container Component

```typescript:components/Chat/ConsentPopup/Container.tsx
import React from 'react';
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";

type ContainerProps = {
  children: React.ReactNode;
};

export function Container({ children }: ContainerProps) {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
      }}
    >
      {children}
    </VStack>
  );
}
```

### Title Component

```typescript:components/Chat/ConsentPopup/Title.tsx
import React from 'react';
import { Text } from "@/design-system/Text";
import { translate } from "@i18n";

export function Title() {
  return <Text>{translate("do_you_trust_this_contact")}</Text>;
}
```

### ConsentButton Component

```typescript:components/Chat/ConsentPopup/ConsentButton.tsx
import React from 'react';
import { Button } from "@design-system/Button/Button";
import { useAppTheme } from "@/theme/useAppTheme";

type ConsentButtonProps = {
  variant: "text" | "fill";
  action?: "danger";
  icon: string;
  text: string;
  onPress: () => void;
};

export function ConsentButton({
  variant,
  action,
  icon,
  text,
  onPress,
}: ConsentButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Button
      variant={variant}
      action={action}
      icon={icon}
      text={text}
      style={{
        alignSelf: "center",
        marginHorizontal: theme.spacing.xxxs,
      }}
      onPress={onPress}
    />
  );
}
```

### Updated `DmConsentPopup` Component

```typescript:components/Chat/ConsentPopup/dm-consent-popup.tsx
import React, { useCallback } from "react";
import { useRouter } from "@/navigation/useNavigation";
import { useMutation } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { refetchConversationQuery } from "@/queries/useConversationQuery";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ensureError } from "@/utils/error";
import { translate } from "@i18n";
import { actionSheetColors } from "@styles/colors";
import { getCurrentAccount } from "../../../data/store/accountsStore";
import {
  consentToConversationIdOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "../../../utils/xmtpRN/contacts";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";
import { Container } from "./Container";
import { Title } from "./Title";
import { ConsentButton } from "./ConsentButton";

type ConsentPopupProps = {
  peerInboxId: InboxId;
  topic: ConversationTopic;
  conversationId: ConversationId;
};

export function DmConsentPopup({
  peerInboxId,
  topic,
  conversationId,
}: ConsentPopupProps) {
  const navigation = useRouter();
  const colorScheme = useColorScheme();

  const {
    mutateAsync: consentToInboxIdsOnProtocolByAccountAsync,
    status: consentToInboxIdsOnProtocolByAccountStatus,
  } = useMutation({
    mutationFn: async (args: { consent: "allow" | "deny" }) => {
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        consentToConversationIdOnProtocolByAccount({
          account: currentAccount,
          conversationId,
          consent: args.consent,
        }),
        consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: args.consent,
        }),
      ]);
    },
    onSuccess: () => {
      refetchConversationQuery(getCurrentAccount()!, topic);
    },
  });

  const handleBlock = useCallback(async () => {
    showActionSheetWithOptions(
      {
        options: [translate("block"), translate("cancel")],
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        title: translate("if_you_block_contact"),
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          try {
            await consentToInboxIdsOnProtocolByAccountAsync({
              consent: "deny",
            });
            navigation.pop();
          } catch (error) {
            captureError(error);
            showSnackbar({
              type: "error",
              message: `Error consenting`,
            });
          }
        }
      }
    );
  }, [
    colorScheme,
    navigation,
    peerInboxId,
    consentToInboxIdsOnProtocolByAccountAsync,
  ]);

  const handleAccept = useCallback(async () => {
    try {
      await consentToInboxIdsOnProtocolByAccountAsync({
        consent: "allow",
      });
    } catch (error) {
      captureErrorWithToast(ensureError(error), {
        message: `Error consenting`,
      });
    }
  }, [peerInboxId, consentToInboxIdsOnProtocolByAccountAsync]);

  if (
    consentToInboxIdsOnProtocolByAccountStatus === "success" ||
    consentToInboxIdsOnProtocolByAccountStatus === "pending"
  ) {
    return null;
  }

  return (
    <Container>
      <Title />
      <VStack
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: theme.spacing.xs,
        }}
      >
        <ConsentButton
          variant="text"
          action="danger"
          icon="xmark"
          text={translate("block")}
          onPress={handleBlock}
        />
        <ConsentButton
          variant="fill"
          icon="checkmark"
          text={translate("accept")}
          onPress={handleAccept}
        />
      </VStack>
    </Container>
  );
}
```

### Explanation

- **Container**: This component wraps the main layout and applies consistent styling.
- **Title**: This component displays the title text, making it easy to change or reuse.
- **ConsentButton**: This component encapsulates the button logic and styling, allowing for easy reuse and customization.

By extracting these components, you can now reuse them in other parts of your application, maintaining consistency and reducing code duplication.

---



---

