## SpecStory

## Implementing Styling from Message Component (11/12/2024, 10:10:08 AM)

_**User**_

this is a simple message, look at the styling in @Message.tsx  and implemnet some of the stuff

---

_**Assistant**_

I'll help you implement similar styling from Message.tsx into SimpleMessage.tsx. The main changes will be around message bubble styling and text colors.

```typescript:components/Chat/Message/SimpleMessage.tsx
// ... existing imports ...
import { useColorScheme } from 'react-native';
import { 
  inversePrimaryColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor 
} from "@styles/colors";

// ... existing types ...

export const SimpleMessage = ({
  fromMe,
  hideBackground,
  content,
}: SimpleMessageProps) => {
  const styles = useStyles();
  
  return (
    <View style={[
      styles.messageContentContainer,
      !hideBackground && styles.messageBubble,
      !hideBackground && (fromMe ? styles.messageBubbleMe : undefined)
    ]}>
      <ClickableText
        style={[
          styles.messageText,
          fromMe ? styles.messageTextMe : undefined,
          hideBackground ? styles.allEmojisAndMaxThree : undefined,
        ]}
      >
        {content}
      </ClickableText>
    </View>
  );
};

// ... MessageAvatarWrapper component ...

const useStyles = () => {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        messageContentContainer: {
          alignSelf: 'flex-start',
          maxWidth: '85%',
        },
        messageBubble: {
          backgroundColor: messageInnerBubbleColor(colorScheme),
          borderRadius: 18,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        messageBubbleMe: {
          backgroundColor: myMessageInnerBubbleColor(colorScheme),
        },
        messageText: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        messageTextMe: {
          color: inversePrimaryColor(colorScheme),
        },
        allEmojisAndMaxThree: {
          fontSize: 64,
          paddingHorizontal: 0,
        },
      }),
    [theme, colorScheme]
  );
};
```

Key changes made:
1. Added imports for color utilities and useColorScheme
2. Added message bubble styling with proper background colors and border radius
3. Updated text colors to match the main Message component
4. Added proper container alignment and max width
5. Conditionally applying bubble styles only when hideBackground is false

The styling now matches the main Message component's bubble and text appearance while keeping the simplified structure.

---



---

