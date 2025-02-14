## SpecStory

## Creating Reusable React Components (12/19/2024, 11:38:23 AM)

_**User**_

Create some reusable component like StatusContainer and StatusText and StatusIconContainer

---

_**Assistant**_

I'll help you create reusable components to reduce code duplication. Here are the changes:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
// ... existing imports ...

// Add these new components at the top level
const StatusContainer = memo(function StatusContainer({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  
  return (
    <AnimatedHStack
      entering={theme.animation.reanimatedFadeInSpring}
      style={{
        alignItems: "center",
        columnGap: theme.spacing.xxxs,
        paddingTop: theme.spacing.xxxs,
      }}
    >
      {children}
    </AnimatedHStack>
  );
});

const StatusText = memo(function StatusText({ text }: { text: string }) {
  return (
    <AnimatedText color="secondary" size="xxs">
      {text}
    </AnimatedText>
  );
});

const StatusIconContainer = memo(function StatusIconContainer({ children }: { children?: React.ReactNode }) {
  const { theme } = useAppTheme();
  
  return (
    <Center
      style={{
        width: 14,
        height: 14,
        padding: 1,
      }}
    >
      {children}
    </Center>
  );
});

// Update SendingStatus to use new components
const SendingStatus = memo(function SendingStatus() {
  return (
    <StatusContainer>
      <StatusText text=" " />
      <StatusIconContainer />
    </StatusContainer>
  );
});

// Update SentStatus to use new components
const SentStatus = memo(function SentStatus() {
  const { theme } = useAppTheme();
  
  return (
    <StatusContainer>
      <StatusText text={translate("message_status.sent")} />
      <StatusIconContainer>
        <Icon
          icon="checkmark"
          size={theme.iconSize.xs}
          color={theme.colors.text.secondary}
        />
      </StatusIconContainer>
    </StatusContainer>
  );
});

// ... rest of the file remains the same ...
```

The changes include:
1. Created `StatusContainer` - handles the common AnimatedHStack layout
2. Created `StatusText` - handles the common text styling
3. Created `StatusIconContainer` - handles the common Center container styling
4. Updated `SendingStatus` and `SentStatus` to use these new components

This refactoring:
- Reduces code duplication
- Makes the code more maintainable
- Makes it easier to make consistent changes across all status types
- Follows the component composition pattern

---



---

