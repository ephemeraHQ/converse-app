## SpecStory

## Refactoring TouchableOpacity to ReactionButton Component (10/15/2024, 2:22:31 PM)

_**User**_

extract and create componet

---

_**Assistant**_

Certainly! I'll extract the TouchableOpacity component and create a new component called ReactionButton. Here's how we can refactor this:

```typescript:components/Chat/Message/ReactionButton.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAppTheme } from '../../../theme/useAppTheme';
import Avatar from "@components/Avatar";
import { getPreferredAvatar, getPreferredName, getProfile } from "@utils/profile";
import { AvatarSizes } from "@styles/sizes";

type IReactionButtonProps = {
  reaction: ReactionCount;
  message: MessageToDisplay;
  onPress: (reaction: ReactionCount) => void;
  profiles: any; // Replace 'any' with the correct type for profiles
};

const MAX_REACTORS_TO_SHOW = 3;
const REACTOR_OFFSET = 10;

export function ReactionButton({ reaction, message, onPress, profiles }: IReactionButtonProps) {
  const { theme } = useAppTheme();
  const reactorCount = reaction.reactors.length;

  return (
    <TouchableOpacity
      onPress={() => onPress(reaction)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.xxs,
        paddingVertical: theme.spacing.xxxs,
        borderRadius: 16,
        borderWidth: 0.25,
        backgroundColor: reaction.userReacted
          ? message.fromMe
            ? theme.colors.primary
            : theme.colors.primary
          : theme.colors.tertiaryBackground,
        borderColor: reaction.userReacted
          ? message.fromMe
            ? theme.colors.tertiaryBackground
            : theme.colors.primary
          : theme.colors.tertiaryBackground,
      }}
    >
      <Text style={{ fontSize: 14, marginHorizontal: 2 }}>{reaction.content}</Text>
      {reactorCount <= MAX_REACTORS_TO_SHOW ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 22,
            marginRight: (reactorCount - 1) * -REACTOR_OFFSET,
          }}
        >
          {reaction.reactors
            .slice(0, MAX_REACTORS_TO_SHOW)
            .map((reactor, index) => (
              <Avatar
                key={reactor}
                uri={getPreferredAvatar(
                  getProfile(reactor, profiles)?.socials
                )}
                name={getPreferredName(
                  getProfile(reactor, profiles)?.socials,
                  reactor
                )}
                size={AvatarSizes.messageReactor}
                invertColor={message.fromMe}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 22,
                  borderWidth: 1,
                  left: index * -REACTOR_OFFSET,
                  zIndex: MAX_REACTORS_TO_SHOW - (index + 1),
                  borderColor: reaction.userReacted
                    ? message.fromMe
                      ? theme.colors.primary
                      : theme.colors.primary
                    : theme.colors.tertiaryBackground,
                }}
              />
            ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", height: 22 }}>
          <Text
            style={{
              fontSize: 12,
              marginHorizontal: 2,
              color: reaction.userReacted
                ? theme.colors.inversePrimary
                : theme.colors.textPrimary,
            }}
          >
            {reactorCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

Now, let's update the `ChatMessageReactions` component to use this new `ReactionButton`:

```typescript:components/Chat/Message/MessageReactions.tsx
// ... existing imports ...
import { ReactionButton } from './ReactionButton';

// ... existing code ...

function ChatMessageReactions({ message, reactions }: Props) {
  // ... existing code ...

  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.reactionsWrapper,
        message.fromMe && { justifyContent: "flex-end" },
      ]}
    >
      {reactionCounts.map((reaction) => (
        <ReactionButton
          key={reaction.content}
          reaction={reaction}
          message={message}
          onPress={handleReactionPress}
          profiles={profiles}
        />
      ))}
    </View>
  );
}

// ... rest of the existing code ...
```

This refactoring extracts the `TouchableOpacity` component into a separate `ReactionButton` component, making the code more modular and easier to maintain. The `ReactionButton` component encapsulates all the logic for rendering a single reaction button, including the avatars or count of reactors.

In the `ChatMessageReactions` component, we now simply map over the `reactionCounts` and render a `ReactionButton` for each reaction. This simplifies the main component and improves readability.

Remember to add any necessary imports in both files and ensure that all types (like `ReactionCount` and `MessageToDisplay`) are properly imported or defined in the new `ReactionButton` component file.

---

_**User**_

just the touchable opacity buttotn

---

_**Assistant**_

Certainly! I'll extract just the TouchableOpacity button into a new component called ReactionButton. Here's the simplified version:

```typescript:components/Chat/Message/ReactionButton.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useAppTheme } from '../../../theme/useAppTheme';

type IReactionButtonProps = TouchableOpacityProps & {
  reaction: {
    userReacted: boolean;
  };
  message: {
    fromMe: boolean;
  };
};

export function ReactionButton({ reaction, message, style, ...props }: IReactionButtonProps) {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.xxs,
        paddingVertical: theme.spacing.xxxs,
        borderRadius: 16,
        borderWidth: 0.25,
        backgroundColor: reaction.userReacted
          ? message.fromMe
            ? theme.colors.primary
            : theme.colors.primary
          : theme.colors.tertiaryBackground,
        borderColor: reaction.userReacted
          ? message.fromMe
            ? theme.colors.tertiaryBackground
            : theme.colors.primary
          : theme.colors.tertiaryBackground,
      }, style]}
      {...props}
    />
  );
}
```

Now, let's update the `ChatMessageReactions` component to use this new `ReactionButton`:

```typescript:components/Chat/Message/MessageReactions.tsx
// ... existing imports ...
import { ReactionButton } from './ReactionButton';

function ChatMessageReactions({ message, reactions }: Props) {
  // ... existing code ...

  return (
    <View
      style={[
        styles.reactionsWrapper,
        message.fromMe && { justifyContent: "flex-end" },
      ]}
    >
      {reactionCounts.map((reaction) => (
        <ReactionButton
          key={reaction.content}
          reaction={reaction}
          message={message}
          onPress={() => handleReactionPress(reaction)}
        >
          <Text style={{ fontSize: 14, marginHorizontal: 2 }}>{reaction.content}</Text>
          {/* Rest of the button content */}
        </ReactionButton>
      ))}
    </View>
  );
}

// ... rest of the existing code ...
```

This refactoring extracts just the TouchableOpacity styling into a separate `ReactionButton` component. The new component handles the styling based on the reaction and message props, while allowing the parent component to define the content and other props.

In the `ChatMessageReactions` component, we now use the `ReactionButton` component and pass the necessary props, including the content as children. This approach provides more flexibility while still encapsulating the button styling logic.

Remember to adjust the imports and types as necessary to match your project structure and type definitions.

---



---

