## SpecStory

## Improving TouchableOpacity Styling in React Native (10/15/2024, 8:19:42 PM)

_**User**_

i hate the style with this what could i do to make it cleaner

---

_**Assistant**_

I understand your concern about the inline style in the `TouchableOpacity` component. To make it cleaner, we can extract this styling logic into a separate function within the `useStyles` hook. Here's how we can refactor this:

```typescript:components/Chat/Message/MessageReactions.tsx
// ... existing imports ...
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View, ViewStyle } from "react-native";

// ... existing code ...

function ChatMessageReactions({ message, reactions }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  // ... existing code ...

  return (
    <View style={[styles.reactionsWrapper, message.fromMe && styles.reactionsWrapperFromMe]}>
      {reactionCounts.map((reaction) => {
        const reactorCount = reaction.reactors.length;
        return (
          <TouchableOpacity
            key={reaction.content}
            onPress={() => handleReactionPress(reaction)}
            style={styles.getReactionButtonStyle(reaction.userReacted, message.fromMe, colorScheme)}
          >
            <Text style={styles.emoji}>{reaction.content}</Text>
            {/* ... rest of the TouchableOpacity content ... */}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ... existing code ...

const useStyles = () => {
  const colorScheme = useColorScheme();
  
  const getReactionButtonStyle = (userReacted: boolean, fromMe: boolean, scheme: ColorSchemeName): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    ...(userReacted
      ? fromMe
        ? {
            backgroundColor: inversePrimaryColor(scheme),
            borderWidth: 1,
            borderColor: primaryColor(scheme),
          }
        : {
            backgroundColor: primaryColor(scheme),
          }
      : {
          backgroundColor: backgroundColor(scheme),
          borderWidth: 1,
          borderColor: textSecondaryColor(scheme),
        }),
  });

  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 4,
      columnGap: 5,
    },
    reactionsWrapperFromMe: {
      justifyContent: "flex-end",
    },
    // ... other existing styles ...
    getReactionButtonStyle,
  });
};
```

This refactoring does the following:

1. We've moved the complex styling logic for the `TouchableOpacity` into a function called `getReactionButtonStyle` within the `useStyles` hook.

2. This function takes the necessary parameters (`userReacted`, `fromMe`, and `colorScheme`) to determine the correct style.

3. In the `ChatMessageReactions` component, we now use this function to get the style for the `TouchableOpacity`.

4. We've also extracted the `justifyContent: "flex-end"` style for the wrapper when `message.fromMe` is true into a separate style (`reactionsWrapperFromMe`).

This approach keeps the component cleaner by moving the style logic into the `useStyles` hook, while still allowing for dynamic styling based on the reaction state and message sender. It also maintains the ability to use the current color scheme for proper theming.

---

_**User**_

its still hard to read

---

_**Assistant**_

I apologize for that. You're right, and I appreciate your feedback. Let's simplify this further to make it more readable. We'll break down the styling into smaller, more manageable pieces and use a more declarative approach. Here's a cleaner version:

```typescript:components/Chat/Message/MessageReactions.tsx
// ... existing imports ...
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";

// ... existing code ...

function ChatMessageReactions({ message, reactions }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  // ... existing code ...

  return (
    <View style={[styles.reactionsWrapper, message.fromMe && styles.reactionsWrapperFromMe]}>
      {reactionCounts.map((reaction) => {
        const reactorCount = reaction.reactors.length;
        return (
          <TouchableOpacity
            key={reaction.content}
            onPress={() => handleReactionPress(reaction)}
            style={[
              styles.reactionButton,
              reaction.userReacted && styles.userReactedButton,
              reaction.userReacted && message.fromMe && styles.userReactedButtonFromMe,
              !reaction.userReacted && styles.otherReactionButton
            ]}
          >
            <Text style={styles.emoji}>{reaction.content}</Text>
            {/* ... rest of the TouchableOpacity content ... */}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ... existing code ...

const useStyles = () => {
  const colorScheme = useColorScheme();
  
  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 4,
      columnGap: 5,
    },
    reactionsWrapperFromMe: {
      justifyContent: "flex-end",
    },
    reactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 4,
      marginBottom: 4,
    },
    userReactedButton: {
      backgroundColor: primaryColor(colorScheme),
    },
    userReactedButtonFromMe: {
      backgroundColor: inversePrimaryColor(colorScheme),
      borderWidth: 1,
      borderColor: primaryColor(colorScheme),
    },
    otherReactionButton: {
      backgroundColor: backgroundColor(colorScheme),
      borderWidth: 1,
      borderColor: textSecondaryColor(colorScheme),
    },
    // ... other existing styles ...
  });
};
```

This refactoring:

1. Breaks down the complex inline style into separate, named styles in the `useStyles` hook.
2. Uses an array of styles in the `TouchableOpacity` component, applying them conditionally.
3. Keeps the base `reactionButton` style separate from the conditional styles.
4. Uses more descriptive names for the styles, making it easier to understand their purpose.

This approach should be much easier to read and maintain. It separates the styling logic from the component structure, making both more clear. The conditional application of styles is now more explicit and easier to follow.

---



---

