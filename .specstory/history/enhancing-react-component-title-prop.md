## SpecStory

## Enhancing React Component Title Prop (1/17/2025, 10:04:39 AM)

_**User**_

title can also be React node

---

_**Assistant**_

I'll help modify the code to allow `title` to be a React node, similar to how `subtitle` is handled. Here's the necessary change:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item.tsx
// ... existing code ...

export type IConversationListItemProps = {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  avatarComponent?: React.ReactNode;
  onPress?: () => void;
  isUnread?: boolean;
  showError?: boolean;
};

export const ConversationListItem = memo(function ConversationListItem({
  onPress,
  isUnread,
  title,
  subtitle,
  avatarComponent,
  showError,
}: IConversationListItemProps) {
  // ... existing code ...
        <VStack style={themed($messagePreviewContainer)}>
          {typeof title === "string" ? (
            <Text preset="bodyBold" weight="medium" numberOfLines={1}>
              {title}
            </Text>
          ) : (
            title
          )}
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
1. Updated the `IConversationListItemProps` type to allow `title` to be either a string or React.ReactNode
2. Modified the title rendering logic to handle both string and ReactNode cases, similar to how subtitle is handled

---



---

