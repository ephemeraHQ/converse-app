## SpecStory

## Updating React Component Subtitle Prop (1/17/2025, 10:02:23 AM)

_**User**_

subtitle can either be a string or React.ReactNode

---

_**Assistant**_

I'll help you update the component to allow `subtitle` to be either a string or React.ReactNode. Here's the necessary change:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item.tsx
// ... existing code ...

export type IConversationListItemProps = {
  title?: string;
  subtitle?: string | React.ReactNode;
  avatarComponent?: React.ReactNode;
  onPress?: () => void;
  isUnread?: boolean;
  showError?: boolean;
};

// ... existing code ...

        <VStack style={themed($messagePreviewContainer)}>
          <Text preset="bodyBold" weight="medium" numberOfLines={1}>
            {title}
          </Text>
          {typeof subtitle === "string" ? (
            <Text preset="small" numberOfLines={2} color="secondary">
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </VStack>

// ... existing code ...
```

The changes include:
1. Updated the type definition to allow `subtitle` to be either `string | React.ReactNode`
2. Added a conditional render for the subtitle that checks if it's a string (wraps in Text component) or a ReactNode (renders directly)

---



---

