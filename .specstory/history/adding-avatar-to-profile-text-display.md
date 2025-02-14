## SpecStory

## Adding Avatar to Profile Text Display (11/14/2024, 11:08:53 AM)

_**User**_

i need to find a way to render an avatar next tothe the profile readable text

---

_**Assistant**_

I'll help you modify the `PressableProfileWithText` component to include an avatar. We'll use a horizontal layout with the avatar next to the text.

```typescript:components/Chat/ChatGroupUpdatedMessage.tsx
// ... existing imports ...
import { HStack } from "@design-system/HStack"; // Add this import
import { Avatar } from "@design-system/Avatar"; // Add this import

// ... existing code ...

const PressableProfileWithText = memo(function PressableProfileWithText({
  profileAddress,
  profileDisplay,
  text,
}: {
  text: string;
  profileDisplay: string;
  profileAddress: string;
}) {
  const { themed } = useAppTheme();
  
  const handlePress = useCallback(() => {
    navigate("Profile", { address: profileAddress });
  }, [profileAddress]);

  const pattern = useMemo(
    () => new RegExp(profileDisplay, "g"),
    [profileDisplay]
  );

  const parseOptions = useMemo(
    () => [
      {
        onPress: handlePress,
        pattern,
      },
    ],
    [handlePress, pattern]
  );

  const $textStyle = getTextStyle(themed, {
    preset: "smaller",
    size: "xxs",
    color: "secondary",
  });

  return (
    <HStack style={themed($messageContainer)}>
      <Avatar 
        address={profileAddress} 
        size="xs" 
        style={themed($avatar)}
      />
      <ParsedText parse={parseOptions} style={$textStyle}>
        {text}
      </ParsedText>
    </HStack>
  );
});

// Add these styles
const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.xs,
});

const $avatar: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "center",
});
```

Key changes made:
1. Added imports for `HStack` and `Avatar` components
2. Wrapped the content in an `HStack` for horizontal layout
3. Added the `Avatar` component before the `ParsedText`
4. Added styles for container spacing and avatar alignment
5. Used the existing address prop to display the avatar

The avatar will now appear next to the text message, creating a more visual representation of the group updates.

---

_**User**_

but how can i make sure the avatar is always next to the name? right now it's hard with using translation also. Look at @en.ts {{name}} is at beginning so might work but i feel if it's not at beginning it doens't work

---

_**Assistant**_

Ah, I see the challenge. Instead of relying on regex pattern matching with the translated text, we should restructure the component to explicitly separate the name and message parts. Here's how we can modify both the translation handling and the component:

1. First, let's modify how we create the content in the main component:

```typescript:components/Chat/ChatGroupUpdatedMessage.tsx
// ... existing imports ...

type MessageParts = {
  name: string;
  nameAddress: string;
  message: string;
};

// Update the processMemberChanges function
const processMemberChanges = (
  members: { inboxId: string }[],
  actionKey: TxKeyPath
) => {
  members.forEach((member) => {
    const socials = mappedSocials[member.inboxId as InboxId]?.[0];
    const address = socials?.address;
    if (!socials || !address) return;
    const readableName = getPreferredName(socials, address);
    
    // Instead of using the translation directly, we'll separate the parts
    const message = actionKey === "group_member_joined" 
      ? "joined the conversation"
      : "left the conversation";

    membersActions.push({
      name: readableName,
      nameAddress: address,
      message,
    });
  });
};

// Update the metadata processing
content.metadataFieldsChanged.forEach((field) => {
  let message = "";
  
  switch (field.fieldName) {
    case "group_name":
      message = `changed the group name to "${field.newValue}"`;
      break;
    case "group_image_url_square":
      message = "changed the group photo";
      break;
    case "description":
      message = `changed the group description to "${field.newValue}"`;
      break;
    default:
      return;
  }

  membersActions.push({
    name: initiatedByReadableName,
    nameAddress: initiatedByAddress,
    message,
  });
});

return (
  <VStack style={themed($container)}>
    {membersActions.map((action, index) => (
      <PressableProfileWithText
        key={`${action.nameAddress}-${index}`}
        name={action.name}
        nameAddress={action.nameAddress}
        message={action.message}
      />
    ))}
  </VStack>
);
```

2. Then update the `PressableProfileWithText` component:

```typescript:components/Chat/ChatGroupUpdatedMessage.tsx
const PressableProfileWithText = memo(function PressableProfileWithText({
  name,
  nameAddress,
  message,
}: {
  name: string;
  nameAddress: string;
  message: string;
}) {
  const { themed } = useAppTheme();
  
  const handlePress = useCallback(() => {
    navigate("Profile", { address: nameAddress });
  }, [nameAddress]);

  const $textStyle = getTextStyle(themed, {
    preset: "smaller",
    size: "xxs",
    color: "secondary",
  });

  const $nameStyle = getTextStyle(themed, {
    preset: "smaller",
    size: "xxs",
    color: "primary",
  });

  return (
    <HStack style={themed($messageContainer)}>
      <Avatar 
        address={nameAddress} 
        size="xs" 
        style={themed($avatar)}
      />
      <Text style={$textStyle}>
        <Text onPress={handlePress} style={$nameStyle}>
          {name}
        </Text>
        {" "}
        {message}
      </Text>
    </HStack>
  );
});

const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
  gap: spacing.xs,
  paddingVertical: spacing.xxs,
});

const $avatar: ThemedStyle<ViewStyle> = () => ({
  marginTop: 2, // Small offset to align with text
});
```

This approach:
1. Separates the name and message content explicitly instead of relying on translation string interpolation
2. Gives us more control over the styling and placement of each element
3. Makes the component more maintainable and less prone to breaking with different translation patterns
4. Ensures the avatar is always properly aligned with the name portion of the message

The tradeoff is that we need to maintain the message strings separately from the translation file, but this gives us much better control over the layout and styling. If you need to support multiple languages, you could still use the translation system for the message parts separately.

---



---

