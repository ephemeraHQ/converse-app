## SpecStory

## Refactoring Message Bubble Styles (11/22/2024, 9:08:59 AM)

_**User**_

make it easier to undetsrand 

---

_**Assistant**_

To make the `bubbleStyle` logic easier to understand, we can refactor the code to separate the conditions and make the return statements more explicit. Here's a simplified version:

```typescript:components/Chat/Message/MessageBubble.tsx
  const bubbleStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: fromMe
        ? theme.colors.bubbles.bubble
        : theme.colors.bubbles.received.bubble,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
    };

    if (fromMe) {
      const shouldAdjustRadius = !hasNextMessageInSeries || showDateChange || hasPreviousMessageInSeries;
      if (shouldAdjustRadius) {
        return {
          ...baseStyle,
          borderBottomLeftRadius: theme.spacing.sm,
          borderBottomRightRadius: theme.spacing["4xs"],
        };
      }
    } else if (!hasNextMessageInSeries) {
      return {
        ...baseStyle,
        borderBottomLeftRadius: theme.spacing["4xs"],
      };
    }

    return baseStyle;
  }, [
    fromMe,
    hasNextMessageInSeries,
    showDateChange,
    hasPreviousMessageInSeries,
    theme,
  ]);
```

### Explanation:
- **Descriptive Variable**: Introduced `shouldAdjustRadius` to clarify the condition for adjusting the border radius when the message is from the user.
- **Separated Conditions**: Clearly separated the logic for when the message is from the user (`fromMe`) and when it is not, making it easier to follow the flow.
- **Explicit Returns**: Each condition block has a clear return statement, improving readability.

---



---

